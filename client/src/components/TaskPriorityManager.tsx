export const TaskPriorityManager: React.FC = (props: any) => {
  return (
    <div>
      <h1>Task Priority Manager</h1>
      {/* Implement a form which has lable Task Name, Task Priority and a Task Description. A button to submit the form */}
      <form>
        <label htmlFor="title">Title</label>
        <input type="text" id="title" name="title" />
        <label htmlFor="taskPriority">Task Priority</label>
        <input type="text" id="taskPriority" name="taskPriority" />
        <label htmlFor="taskDescription">Task Description</label>
        <input type="text" id="taskDescription" name="taskDescription" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
