import React, { useState } from "react";
import { Text, useInput } from "ink";
import { Panel } from "../Layout/Panel.jsx";
import { chip } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";
import { pad } from "../../utils/format.js";

const LABELS = { name: "Name", email: "Email", password: "Password", confirm: "Confirm" };

const MODES = {
  signin: {
    title: "sign in",
    fields: ["email", "password"],
    links: [
      { to: "signup", label: "Create an account" },
      { to: "reset", label: "Forgot password?" },
    ],
    button: "Sign in",
  },
  signup: {
    title: "sign up",
    fields: ["name", "email", "password", "confirm"],
    links: [{ to: "signin", label: "Back to sign in" }],
    button: "Create account",
  },
  reset: {
    title: "reset password",
    fields: ["email"],
    links: [{ to: "signin", label: "Back to sign in" }],
    button: "Send reset link",
  },
};

function validate(mode, form) {
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (mode === "reset") return null;
  if (!form.password) return "Enter your password.";
  if (mode === "signup" && form.password.length < 6) return "Password must be at least 6 characters.";
  if (mode === "signup" && form.password !== form.confirm) return "Passwords do not match.";
  return null;
}

export function AuthForm({ width, auth, initialEmail, onLogin, onQuit }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: initialEmail, password: "", confirm: "" });
  const [focus, setFocus] = useState(initialEmail ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const { title, fields, links, button } = MODES[mode];
  const buttonIndex = fields.length;
  const itemCount = fields.length + 1 + links.length;

  function changeMode(next) {
    setMode(next);
    setFocus(0);
    setMessage(null);
    setForm({ ...form, password: "", confirm: "" });
  }

  async function submit() {
    const error = validate(mode, form);
    if (error) {
      setMessage({ ok: false, text: error });
      return;
    }

    setBusy(true);
    setMessage({ ok: true, text: "Please wait..." });
    try {
      if (mode === "reset") {
        await auth.resetPassword(form.email);
        setMessage({ ok: true, text: "Reset link sent, check your inbox." });
      } else if (mode === "signup") {
        onLogin(await auth.signUp(form));
      } else {
        onLogin(await auth.signIn(form));
      }
    } catch (err) {
      setMessage({ ok: false, text: auth.constructor.messageFor(err) });
    }
    setBusy(false);
  }

  function pressEnter() {
    if (focus < buttonIndex - 1) setFocus(focus + 1);
    else if (focus <= buttonIndex) submit();
    else changeMode(links[focus - buttonIndex - 1].to);
  }

  useInput((input, key) => {
    if (key.ctrl && input === "c") return onQuit();
    if (busy) return;

    if (key.escape) {
      if (mode === "signin") onQuit();
      else changeMode("signin");
    } else if (key.upArrow || (key.tab && key.shift)) {
      setFocus((focus - 1 + itemCount) % itemCount);
    } else if (key.downArrow || key.tab) {
      setFocus((focus + 1) % itemCount);
    } else if (key.return) {
      pressEnter();
    } else if (focus < fields.length) {
      const field = fields[focus];
      if (key.backspace || key.delete) {
        setForm({ ...form, [field]: form[field].slice(0, -1) });
      } else if (input && !key.ctrl && !key.meta) {
        setForm({ ...form, [field]: form[field] + input.replace(/[\x00-\x1f\x7f]/g, "") });
      }
    }
  });

  const inputWidth = Math.max(8, width - 16);

  function renderField(field, i) {
    const active = focus === i;
    let value = form[field];
    if (field === "password" || field === "confirm") value = "•".repeat(value.length);
    if (active) value += "█";
    value = value.slice(-inputWidth);

    return (
      <Text key={field} wrap="truncate">
        <Text color={theme.hotkey}>{active ? " > " : "   "}</Text>
        <Text color={active ? theme.title : theme.text}>{pad(LABELS[field], 10)}</Text>
        <Text color={theme.title} backgroundColor={theme.meterEmpty}>
          {pad(value, inputWidth)}
        </Text>
      </Text>
    );
  }

  function renderButton(label, i) {
    const active = focus === i;
    return (
      <Text key={label} wrap="truncate">
        <Text color={theme.hotkey}>{active ? " > " : "   "}</Text>
        <Text color={active ? theme.selectedFg : theme.graphText} backgroundColor={active ? theme.selectedBg : undefined}>
          {label}
        </Text>
      </Text>
    );
  }

  return (
    <Panel
      width={width}
      height={fields.length + links.length + 7}
      color={theme.box.auth}
      title={{ left: [chip("binaire", { bold: true })], right: [chip(title, { color: theme.warn })] }}
      footer={{ left: [chip("tab/arrows move, enter select", { color: theme.dim })], right: [chip("esc", { color: theme.dim })] }}
    >
      <Text> </Text>
      {fields.map(renderField)}
      <Text> </Text>
      {renderButton(`[ ${button} ]`, buttonIndex)}
      {links.map((link, i) => renderButton(link.label, buttonIndex + 1 + i))}
      <Text> </Text>
      <Text wrap="truncate" color={message?.ok ? theme.ok : theme.error}>
        {" " + (message?.text ?? "")}
      </Text>
    </Panel>
  );
}
