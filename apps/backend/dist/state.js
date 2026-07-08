"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemState = void 0;
exports.systemState = {
    currentTask: "Sleeping / Waiting for Next Task",
    lastUpdate: new Date(),
    setTask(task) {
        this.currentTask = task;
        this.lastUpdate = new Date();
        console.log(`[System State] ${task}`);
    }
};
