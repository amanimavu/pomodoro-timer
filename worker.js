let intervalId;

onmessage = (e) => {
    if (e.data.stop) {
        clearInterval(intervalId);
        intervalId = undefined;
        postMessage({ running: false });
    } else if (e.data.start && intervalId === undefined) {
        intervalId = setInterval(() => {
            postMessage("update timer");
        }, 1000);
        postMessage({ running: true });
    }
};