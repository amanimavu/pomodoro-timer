if (window.Worker) {
    let sessionLength = 25; //initial session value in minutes
    let seconds = 0;
    let breakLength = 5; //initial break value in minutes

    let sessionLengthInSeconds = sessionLength * 60; // change to seconds
    let breakLengthInSeconds = breakLength * 60;
    let onBreak = false;

    const myWorker = new Worker("worker.js");
    let intervalId;

    const updateTimer = () => {
        if (!onBreak && sessionLengthInSeconds > 0) {
            sessionLengthInSeconds -= 1;
            seconds = sessionLengthInSeconds % 60;
            if (sessionLengthInSeconds === 59) {
                $("html").attr("style", "--secondary-color: #ff857a");
            }
            if (seconds === 59) {
                sessionLength -= 1;
            }

            if (sessionLengthInSeconds === 0) {
                $("#beep").trigger("play");
            }
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
                $("html").attr("style", "--secondary-color: #ffffe3");
                $("#timer-label").text("Break");
                $("#time-left").text(
                    `${breakLength.toString().padStart(2, 0)}:00`
                );
                breakLengthInSeconds -= 1;
            } else {
                if (breakLengthInSeconds >= 0) {
                    if (breakLengthInSeconds === 59) {
                        $("html").attr("style", "--secondary-color: #ff857a");
                    }

                    if (breakLengthInSeconds === 0) {
                        $("#beep").trigger("play");
                    }

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
                    $("html").attr("style", "--secondary-color: #ffffe3");
                    $("#timer-label").text("Session");
                    $("#time-left").text(
                        `${sessionLength.toString().padStart(2, 0)}:00`
                    );
                }
            }
        }
    };

    myWorker.onmessage = (e) => {
        if (e.data.intervalId !== undefined) {
            intervalId = e.data.intervalId;
        } else {
            updateTimer();
        }
    };

    $("document").ready(() => {
        const updateSession = ({ increment }) => {
            if (!intervalId) {
                sessionLength = parseInt($("#session-length").text());
                sessionLength = increment
                    ? sessionLength + 1
                    : sessionLength - 1;

                sessionLengthInSeconds = sessionLength * 60;
                $("#session-length").text(sessionLength);
                if (!onBreak) {
                    $("html").attr("style", "--secondary-color: #ffffe3");
                    $("#time-left").text(
                        `${sessionLength.toString().padStart(2, 0)}:00`
                    );
                }
            }
        };

        const updateBreak = ({ increment }) => {
            if (!intervalId) {
                breakLength = parseInt($("#break-length").text());
                breakLength = increment ? breakLength + 1 : breakLength - 1;

                breakLengthInSeconds = breakLength * 60;
                $("#break-length").text(breakLength);
                if (onBreak) {
                    $("html").attr("style", "--secondary-color: #ffffe3");
                    $("#time-left").text(
                        `${breakLength.toString().padStart(2, 0)}:00`
                    );
                }
            }
        };

        $("#session-increment").on("click", () => {
            if (sessionLength < 60) {
                updateSession({ increment: true });
            }
        });

        $("#session-decrement").on("click", () => {
            if (sessionLength > 1) {
                updateSession({ increment: false });
            }
        });

        $("span#reset").on("click", () => {
            intervalId && myWorker.postMessage({ intervalId });
            onBreak = false;
            sessionLength = 25;
            breakLength = 5;
            sessionLengthInSeconds = sessionLength * 60;
            breakLengthInSeconds = breakLength * 60;
            $("audio").trigger("pause");
            $("audio").prop("currentTime", 0);
            $("#session-length").text(sessionLength);
            $("#break-length").text(breakLength);
            $("#time-left").text("25:00");
            $("#timer-label").text("Session");
            $("html").attr("style", "--secondary-color: #ffffe3");
        });

        $("#break-increment").on("click", () => {
            if (breakLength < 60) {
                updateBreak({ increment: true });
            }
        });

        $("#break-decrement").on("click", () => {
            if (breakLength > 1) {
                updateBreak({ increment: false });
            }
        });

        $("span#start_stop").on("click", () => {
            //start timer if not running
            //stop timer if running

            myWorker.postMessage({ intervalId });
        });

        $("html").on("keydown", (e) => {
            if (e.which === 32) {
                $("span#start_stop").trigger("click");
            }
        });
    });
}
