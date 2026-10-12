# Pomodoro Timer

A simple and elegant Pomodoro Timer application to help you stay focused and productive using the Pomodoro Technique.

> The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. The technique uses a timer to break work into focused intervals (traditionally 25 minutes) called "pomodoros," followed by short breaks. This approach is based on the idea that frequent breaks can improve mental agility and help maintain focus over longer periods.
>
> The method consists of the following basic steps:
>
> 1. Choose a task to work on
> 2. Set the timer (traditionally to 25 minutes)
> 3. Work on the task until the timer rings
> 4. Take a short break (5 minutes)
> 5. After four pomodoros, take a longer break (15-30 minutes)
>
> This structured approach to work and breaks helps combat mental fatigue, reduce distractions, and maintain consistent productivity throughout the day.

## Features

-   Installable as a PWA and fully usable offline
-   Customizable session length (1-60 minutes)
-   Customizable break length (1-60 minutes)
-   Visual countdown timer with a progress ring
-   Audio notification when sessions/breaks end
-   Visual color indicators for last minute of sessions
-   Play/Pause functionality with a paused indicator
-   Reset option to restart the current phase with your chosen lengths

## Technologies Used

-   HTML5
-   Service Worker + Web App Manifest (PWA, offline support)
-   CSS3
-   JavaScript
-   jQuery
-   Google Material Icons

## Usage

1. Set your desired session length using the up/down arrows (default: 25 minutes)
2. Set your desired break length using the up/down arrows (default: 5 minutes)
3. Click the play/pause button to start/pause the timer
4. The timer will automatically switch between sessions and breaks
5. Use the reset button to restart the session from the top, keeping your chosen lengths

## Visual Indicators

-   Timer is displayed on a progress ring that drains as the phase runs
-   Timer turns red during the last minute of each session/break
-   Audio beep plays when switching between session and break

## Installation

1. Clone this repository
2. Open the `index.html` file in your browser

## Progressive Web App

The app is installable and works offline.

- Serve the folder over `http://localhost` (or HTTPS) - service workers do not run when `index.html` is opened directly from disk
    ```bash
    python3 -m http.server 8000
    ```
    then visit <http://localhost:8000>
- Chrome/Edge show an **Install app** button under the timer once the app qualifies; it can also be installed from the address bar
- On iOS use Safari and Share -> Add to Home Screen
- Once installed the timer runs fully offline, the audio cue included

Bump `VERSION` in `service-worker.js` whenever a cached file changes, otherwise clients keep serving the old copy from the cache.
