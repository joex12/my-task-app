export const project = {
  id: 2,
  tasks: [
    {
      title: 'Mobile App',
      children: [
        {
          title: 'Login Screen',
          assignee: 'Bob',
          date: '15.09.2025',
          note: 'Implement OAuth',
          status: 'Done',
        },
        {
          title: 'Dashboard',
          assignee: '',
          date: '',
          note: 'Add charts',
          status: 'In Progress',
          children: [
            {
              title: 'Chart Component',
              assignee: 'Alice',
              date: '',
              note: '',
              status: 'Testing',
            },
          ],
        },
      ],
    },
  ],
};