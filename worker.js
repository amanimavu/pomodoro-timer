onmessage = (e) => {
    let intervalId = e.data.intervalId;
    if (intervalId) {
        console.log("stop", `interval id: ${intervalId}`);
        clearInterval(intervalId);
        postMessage({ intervalId: null });
    } else {
        console.log("start", `interval id: ${intervalId}`);
        intervalId = setInterval(() => {
            postMessage("update timer");
        }, 1000);
        postMessage({ intervalId });
    }
};
