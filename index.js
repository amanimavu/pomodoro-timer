if (window.Worker) {
    let sessionLength = 25; //initial session value in minutes
    let seconds = 0;
    let breakLength = 5; //initial break value in minutes

    let sessionLengthInSeconds = sessionLength * 60; // change to seconds
    let breakLengthInSeconds = breakLength * 60;
    let onBreak = false;

    const myWorker = new Worker("worker.js");
    let running = false;
    // Paused only counts once the clock has actually been started: a timer
    // sitting at its full length has not been paused, it is waiting.
    let hasStarted = false;

    const MIN_MINUTES = 1;
    const MAX_MINUTES = 60;

    const clampMinutes = (minutes) =>
        Math.min(Math.max(minutes, MIN_MINUTES), MAX_MINUTES);

    const shownLength = (kind) => parseInt($(`#${kind}-length`).text());

    const setPaused = (paused) => $("#timer-status").prop("hidden", !paused);

    // The play/pause tooltip names the action the button will perform next.
    const setActionTip = () =>
        $("#start_stop-tip").text(running ? "Pause" : "Start");

    // The steppers are frozen while the timer runs, and at the limits
    // (1 min / 60 min) the button that cannot change anything is frozen too.
    const refreshSteppers = () => {
        const session = shownLength("session");
        const brk = shownLength("break");

        $("#session-decrement").prop(
            "disabled",
            running || session <= MIN_MINUTES
        );
        $("#session-increment").prop(
            "disabled",
            running || session >= MAX_MINUTES
        );
        $("#break-decrement").prop("disabled", running || brk <= MIN_MINUTES);
        $("#break-increment").prop("disabled", running || brk >= MAX_MINUTES);
    };

    const startTimer = () => {
        running = true;
        hasStarted = true;
        myWorker.postMessage({ start: true });
        setPaused(false);
        setActionTip();
        refreshSteppers();
    };

    const stopTimer = () => {
        if (!running) {
            return;
        }

        running = false;
        myWorker.postMessage({ stop: true });
        setPaused(hasStarted);
        setActionTip();
        refreshSteppers();
    };

    const setEnding = (ending) => $("html").toggleClass("ending", ending);

    const setProgress = (remainingSeconds, totalSeconds) => {
        const ratio =
            totalSeconds > 0
                ? Math.min(Math.max(remainingSeconds / totalSeconds, 0), 1)
                : 0;
        document.documentElement.style.setProperty(
            "--progress",
            ratio.toFixed(4)
        );
    };

    const sessionTotal = () => parseInt($("#session-length").text()) * 60;
    const breakTotal = () => parseInt($("#break-length").text()) * 60;

    // Idle states: the whole duration is still ahead of us.
    const setFullProgress = (totalSeconds) =>
        setProgress(totalSeconds, totalSeconds);

    const updateTimer = () => {
        if (!onBreak && sessionLengthInSeconds > 0) {
            sessionLengthInSeconds -= 1;
            seconds = sessionLengthInSeconds % 60;
            if (sessionLengthInSeconds === 59) {
                setEnding(true);
            }
            if (seconds === 59) {
                sessionLength -= 1;
            }

            if (sessionLengthInSeconds === 0) {
                $("#beep").trigger("play");
            }
            setProgress(sessionLengthInSeconds, sessionTotal());
            $("#time-left").text(
                `${sessionLength.toString().padStart(2, 0)}:${seconds
                    .toString()
                    .padStart(2, 0)}`
            );
        } else {
            if (
                (breakLengthInSeconds / 60).toString() ===
                $("#break-length").text()
            ) {
                onBreak = true;
                setEnding(false);
                $("#timer-label").text("Break");
                $("#time-left").text(
                    `${breakLength.toString().padStart(2, 0)}:00`
                );
                setFullProgress(breakTotal());
                breakLengthInSeconds -= 1;
            } else {
                if (breakLengthInSeconds >= 0) {
                    if (breakLengthInSeconds === 59) {
                        setEnding(true);
                    }

                    if (breakLengthInSeconds === 0) {
                        $("#beep").trigger("play");
                    }

                    setProgress(breakLengthInSeconds, breakTotal());
                    seconds = breakLengthInSeconds % 60;
                    if (seconds === 59) {
                        breakLength -= 1;
                    }

                    $("#time-left").text(
                        `${breakLength.toString().padStart(2, 0)}:${seconds
                            .toString()
                            .padStart(2, 0)}`
                    );

                    breakLengthInSeconds -= 1;
                } else {
                    sessionLength = parseInt($("#session-length").text());
                    breakLength = parseInt($("#break-length").text());

                    sessionLengthInSeconds = sessionLength * 60;
                    breakLengthInSeconds = breakLength * 60;
                    onBreak = false;
                    setEnding(false);
                    $("#timer-label").text("Session");
                    $("#time-left").text(
                        `${sessionLength.toString().padStart(2, 0)}:00`
                    );
                    setFullProgress(sessionTotal());
                }
            }
        }
    };

    myWorker.onmessage = (e) => {
        if (e.data === "update timer") {
            running && updateTimer();
            return;
        }

        running = e.data.running;
    };

    // Offline support and PWA installability. Only meaningful over
    // http(s), so opening index.html straight off disk just skips it.
    let deferredInstallPrompt = null;

    const registerServiceWorker = () => {
        if (!("serviceWorker" in navigator)) {
            return;
        }

        navigator.serviceWorker.register("service-worker.js").catch((error) => {
            console.warn("[pwa] service worker registration failed", error);
        });
    };

    const showInstallButton = () => {
        if (deferredInstallPrompt) {
            $("#install").prop("hidden", false);
        }
    };

    window.addEventListener("beforeinstallprompt", (event) => {
        // Chrome no longer shows its own install bar, so we surface it here.
        event.preventDefault();
        deferredInstallPrompt = event;
        showInstallButton();
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        $("#install").prop("hidden", true);
    });

    $("document").ready(() => {
        registerServiceWorker();

        $("#install").on("click", async () => {
            if (!deferredInstallPrompt) {
                return;
            }

            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            $("#install").prop("hidden", true);
        });

        $(window).on("load", () => {
            $("main").css("opacity", "1");
            // The prompt may already have fired before this handler was bound.
            navigator.serviceWorker?.ready.then(showInstallButton);
        });
        
        const updateSession = ({ increment }) => {
            if (running) {
                return;
            }

            const current = shownLength("session");
            const next = clampMinutes(current + (increment ? 1 : -1));
            if (next === current) {
                return;
            }

            sessionLength = next;
            sessionLengthInSeconds = sessionLength * 60;
            $("#session-length").text(sessionLength);
            refreshSteppers();

            if (!onBreak) {
                setEnding(false);
                $("#time-left").text(
                    `${sessionLength.toString().padStart(2, 0)}:00`
                );
                setFullProgress(sessionTotal());
            }
        };

        const updateBreak = ({ increment }) => {
            if (running) {
                return;
            }

            const current = shownLength("break");
            const next = clampMinutes(current + (increment ? 1 : -1));
            if (next === current) {
                return;
            }

            breakLength = next;
            breakLengthInSeconds = breakLength * 60;
            $("#break-length").text(breakLength);
            refreshSteppers();

            if (onBreak) {
                setEnding(false);
                $("#time-left").text(
                    `${breakLength.toString().padStart(2, 0)}:00`
                );
                setFullProgress(breakTotal());
            }
        };

        $("#session-increment").on("click", () => {
            updateSession({ increment: true });
        });

        $("#session-decrement").on("click", () => {
            updateSession({ increment: false });
        });

        $("#reset").on("click", () => {
            stopTimer();
            onBreak = false;
            // Restart from the top with the lengths the user chose, not the
            // app defaults: the steppers are only editable while stopped,
            // so whatever they show is the setting.
            sessionLength = shownLength("session");
            breakLength = shownLength("break");
            sessionLengthInSeconds = sessionLength * 60;
            breakLengthInSeconds = breakLength * 60;
            $("audio").trigger("pause");
            $("audio").prop("currentTime", 0);
            $("#timer-label").text("Session");
            $("#time-left").text(
                `${sessionLength.toString().padStart(2, 0)}:00`
            );
            setEnding(false);
            setFullProgress(sessionTotal());
            hasStarted = false;
            setPaused(false);
            refreshSteppers();
        });

        $("#break-increment").on("click", () => {
            updateBreak({ increment: true });
        });

        $("#break-decrement").on("click", () => {
            updateBreak({ increment: false });
        });

        $("#start_stop").on("click", () => {
            //start timer if not running
            //stop timer if running

            running ? stopTimer() : startTimer();
        });

        refreshSteppers();
        setPaused(false);
        setActionTip();

        $("html").on("keydown", (e) => {
            if (e.which === 32) {
                // A focused button activates itself on space, so only
                // handle the shortcut when focus is elsewhere.
                if (document.activeElement.tagName !== "BUTTON") {
                    e.preventDefault(); // stop the page from scrolling
                    running ? stopTimer() : startTimer();
                }
            }
        });
    });
}
