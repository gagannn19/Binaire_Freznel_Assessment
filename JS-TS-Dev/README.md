# Binaire System Monitor

A terminal system monitor (like btop) made with React + Ink. Shows CPU, memory, disks, network, battery and running processes. Login is done with Firebase (email + password).

## Setup

Needs Node 22+.

```bash
npm install
cp .env.example .env
npm start
```

Put your Firebase web config in `.env`. You get it from Firebase console → Project settings → Your apps. Email/Password sign-in has to be enabled in Authentication.

If `.env` is empty the app still runs, you can just continue as guest.

## Keys

- `m` help menu
- `q` quit
- `1` `2` `3` `4` show/hide cpu, mem, net, proc
- `+` `-` change update speed
- `L` sign out
- `↑` `↓` select process
- `←` `→` change sort
- `r` reverse sort
- `e` tree view
- `f` filter processes
- `i` process info
- `t` / `k` terminate / kill process
- `b` / `n` switch network interface
