$("document").ready(() => {
    let sessionLength = 25; //initial session value in minutes
    let seconds = 0;
    let breakLength = 5; //initial break value in minutes

    let sessionLengthInSeconds = sessionLength * 60; // change to seconds
    let breakLengthInSeconds = breakLength * 60;
    let intervalId;
    let onBreak = false;
    let sessionCounts = 0;

    const updateSession = ({ increment }) => {
        sessionLength = Math.ceil(sessionLengthInSeconds / 60);
        sessionLength = increment ? sessionLength + 1 : sessionLength - 1;

        sessionLengthInSeconds = sessionLength * 60;
        $("#session-length").text(sessionLength);
        if (!onBreak) {
            $("html").attr("style", "--secondary-color: #ffffe3");
            $("#time-left").text(
                `${sessionLength.toString().padStart(2, 0)}:00`
            );
        }
    };

    const updateBreak = ({ increment }) => {
        breakLength = Math.ceil(breakLengthInSeconds / 60);
        breakLength = increment ? breakLength + 1 : breakLength - 1;

        breakLengthInSeconds = breakLength * 60;
        $("#break-length").text(breakLength);
        if (onBreak) {
            $("html").attr("style", "--secondary-color: #ffffe3");
            $("#time-left").text(`${breakLength.toString().padStart(2, 0)}:00`);
        }
    };

    $("#session-increment span").on("click", () => {
        if (sessionLength < 60) {
            updateSession({ increment: true });
        }
    });

    $("#session-decrement span").on("click", () => {
        if (sessionLength > 1) {
            updateSession({ increment: false });
        }
    });

    $("#reset span").on("click", () => {
        intervalId && clearInterval(intervalId);
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

    $("#break-increment span").on("click", () => {
        if (breakLength < 60) {
            updateBreak({ increment: true });
        }
    });

    $("#break-decrement span").on("click", () => {
        if (breakLength > 1) {
            updateBreak({ increment: false });
        }
    });

    $("#start_stop span").on("click", () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        } else {
            intervalId = setInterval(() => {
                if (sessionLengthInSeconds > 0) {
                    sessionLengthInSeconds -= 1;
                    seconds = sessionLengthInSeconds % 60;
                    if (sessionLengthInSeconds === 59) {
                        $("html").attr("style", "--secondary-color: #ff857a");
                    }
                    if (seconds === 59) {
                        sessionLength -= 1;
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
                        $("audio").trigger("play");
                        $("html").attr("style", "--secondary-color: #ffffe3");
                        $("#timer-label").text("Break");
                        $("#time-left").text(
                            `${breakLength.toString().padStart(2, 0)}:00`
                        );
                        breakLengthInSeconds -= 1;
                    } else {
                        if (breakLengthInSeconds >= 0) {
                            if (breakLengthInSeconds === 59) {
                                $("html").attr(
                                    "style",
                                    "--secondary-color: #ff857a"
                                );
                            }

                            seconds = breakLengthInSeconds % 60;
                            if (seconds === 59) {
                                breakLength -= 1;
                            }

                            $("#time-left").text(
                                `${breakLength
                                    .toString()
                                    .padStart(2, 0)}:${seconds
                                    .toString()
                                    .padStart(2, 0)}`
                            );

                            breakLengthInSeconds -= 1;
                        } else {
                            sessionLength = parseInt(
                                $("#session-length").text()
                            );
                            breakLength = parseInt($("#break-length").text());

                            sessionLengthInSeconds = sessionLength * 60;
                            breakLengthInSeconds = breakLength * 60;
                            onBreak = false;
                            $("audio").trigger("play");
                            $("html").attr(
                                "style",
                                "--secondary-color: #ffffe3"
                            );
                            $("#timer-label").text("Session");
                            $("#time-left").text(
                                `${sessionLength.toString().padStart(2, 0)}:00`
                            );
                        }
                    }
                }
            }, 1000);
        }
    });
});
