export const systemState = {
  currentTask: "Sleeping / Waiting for Next Task",
  lastUpdate: new Date(),
  setTask(task: string) {
    this.currentTask = task;
    this.lastUpdate = new Date();
    console.log(`[System State] ${task}`);
  }
};
