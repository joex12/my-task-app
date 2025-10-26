import React, { useState, useEffect } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import NoteIcon from '@mui/icons-material/Note';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import projectsData from './projects';

// Theme constants for unified styling
const themeConstants = {
  fieldBackground: '#F8F8F8',
  textColor: 'black',
  placeholderColor: 'grey.500',
  menuItemColor: 'black',
  borderColor: 'rgba(100, 149, 237, 0.2)',
  borderHoverColor: 'rgba(100, 149, 237, 0.7)',
  borderFocusedColor: 'rgba(100, 149, 237, 1)',
  pageBackground: '#F0F5FF',
  projectNameColor: '#6495ED',
};

// Set global background color for the entire page
const GlobalStyles = styled('div')({
  'html, body': {
    backgroundColor: themeConstants.pageBackground,
    margin: 0,
    padding: 0,
    width: '100vw',
    minHeight: '100vh',
    position: 'absolute',
    top: 0,
    left: 0,
    overflowX: 'hidden',
  },
});

// Custom tooltip for multi-line notes
const CustomTooltip = styled(Tooltip)(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    maxWidth: '300px',
    whiteSpace: 'pre-line',
    fontSize: '0.875rem',
    padding: theme.spacing(1),
  },
}));

// Process tasks to add IDs, depth, and calculate percentage for top-level tasks
const processTasks = (tasks, depth = 0, idCounter = { current: 1 }) => {
  const statusFactors = {
    Missing: 0,
    Suboptimal: 0.5,
    Inapplicable: 1,
    'In Progress': 0.25,
    Testing: 0.5,
    Done: 1,
  };

  return tasks.map(task => {
    const processedTask = {
      ...task,
      id: task.id || idCounter.current++,
      depth: task.depth ?? depth,
      children: task.children ? processTasks(task.children, depth + 1, idCounter) : undefined,
    };

    if (depth === 0 && processedTask.children) {
      const calculatePercentage = (tasks) => {
        let totalWeighted = 0;
        let totalPriority = 0;

        const process = (taskList) => {
          taskList.forEach(t => {
            const statusFactor = statusFactors[t.status] || 0;
            const priority = t.priority || 3;
            totalWeighted += priority * statusFactor;
            totalPriority += priority;
            if (t.children) process(t.children);
          });
        };

        process(tasks);
        return totalPriority > 0 ? Math.round((totalWeighted / totalPriority) * 100) : 0;
      };

      processedTask.percentage = calculatePercentage(processedTask.children);
    }

    return processedTask;
  });
};

// Function to swap positions in the task tree
const swapInParent = (tasks, taskId, direction) => {
  const newTasks = tasks.map(task => ({
    ...task,
    children: task.children ? [...task.children] : undefined,
  }));

  for (let i = 0; i < newTasks.length; i++) {
    if (newTasks[i].id === taskId) {
      if (direction === 'up' && i > 0 && newTasks[i - 1].depth === newTasks[i].depth) {
        [newTasks[i - 1], newTasks[i]] = [newTasks[i], newTasks[i - 1]];
        return newTasks;
      } else if (
        direction === 'down' &&
        i < newTasks.length - 1 &&
        newTasks[i + 1].depth === newTasks[i].depth
      ) {
        [newTasks[i], newTasks[i + 1]] = [newTasks[i + 1], newTasks[i]];
        return newTasks;
      }
      return newTasks;
    }
    if (newTasks[i].children) {
      const updatedChildren = swapInParent(newTasks[i].children, taskId, direction);
      newTasks[i].children = updatedChildren;
      return newTasks;
    }
  }
  return newTasks;
};

// Task component
function Task({ task, updateTask, isEditMode, index, totalTasks }) {
  const [expanded, setExpanded] = useState([]);
  const [tempDate, setTempDate] = useState(task.date || '');
  const [tempTestingDate, setTempTestingDate] = useState(task.testingDate || '');
  const [tempResultsDate, setTempResultsDate] = useState(task.resultsDate || '');
  const [tempQuarterlyDate, setTempQuarterlyDate] = useState(task.quarterlyDate || '');
  const [tempNote, setTempNote] = useState(task.note || '');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task.title || '');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? [...expanded, panel] : expanded.filter(p => p !== panel));
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  const formatDate = (value) => {
    const today = new Date();
    const parts = value.split('.').filter(p => p);

    if (parts.length === 1 && parts[0]) {
      return `${parts[0].padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    } else if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${today.getFullYear()}`;
    } else if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
    }
    return value;
  };

  const addDays = (dateStr, days) => {
    if (!dateStr || !/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return '';
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const addMonths = (dateStr, months) => {
    if (!dateStr || !/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return '';
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    date.setMonth(date.getMonth() + months);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const handleDateSubmit = (field, value, tempSetter) => {
    const formatted = formatDate(value);
    if (formatted !== task[field]) {
      updateTask(task.id, field, formatted);
      tempSetter(formatted);

      if (field === 'date' && formatted) {
        const testingDate = addDays(formatted, 7);
        updateTask(task.id, 'testingDate', testingDate);
        setTempTestingDate(testingDate);

        if (testingDate) {
          const resultsDate = addMonths(testingDate, 1);
          updateTask(task.id, 'resultsDate', resultsDate);
          setTempResultsDate(resultsDate);

          if (resultsDate) {
            const quarterlyDate = addMonths(resultsDate, 3);
            updateTask(task.id, 'quarterlyDate', quarterlyDate);
            setTempQuarterlyDate(quarterlyDate);
          }
        }
      } else if (field === 'testingDate' && formatted) {
        const resultsDate = addMonths(formatted, 1);
        updateTask(task.id, 'resultsDate', resultsDate);
        setTempResultsDate(resultsDate);

        if (resultsDate) {
          const quarterlyDate = addMonths(resultsDate, 3);
          updateTask(task.id, 'quarterlyDate', quarterlyDate);
          setTempQuarterlyDate(quarterlyDate);
        }
      } else if (field === 'resultsDate' && formatted) {
        const quarterlyDate = addMonths(formatted, 3);
        updateTask(task.id, 'quarterlyDate', quarterlyDate);
        setTempQuarterlyDate(quarterlyDate);
      }
    }
  };

  const handleNoteKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNoteSubmit();
    }
  };

  const handleNoteSubmit = () => {
    if (tempNote !== task.note) {
      updateTask(task.id, 'note', tempNote);
    }
    setNoteDialogOpen(false);
  };

  const handleDateKeyPress = (field, tempSetter) => (e) => {
    if (e.key === 'Enter') {
      handleDateSubmit(field, e.target.value, tempSetter);
    }
  };

  const handleAssigneeChange = (e) => {
    updateTask(task.id, 'assignee', e.target.value);
  };

  const handleStatusChange = (e) => {
    updateTask(task.id, 'status', e.target.value);
  };

  const handleTitleClick = () => {
    if (isEditMode) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleSubmit = () => {
    if (tempTitle !== task.title && tempTitle.trim()) {
      updateTask(task.id, 'title', tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddChild = (e) => {
    e.stopPropagation();
    const newChild = {
      title: `New ${task.depth === 0 ? 'Subcategory' : 'Child'}`,
      assignee: '',
      date: '',
      testingDate: '',
      resultsDate: '',
      quarterlyDate: '',
      note: '',
      status: '',
      priority: 3,
      children: task.depth < 1 ? [] : undefined,
      id: Date.now() + Math.random(),
    };
    updateTask(task.id, 'addChild', newChild);
  };

  const handleDeleteTask = (e) => {
    e.stopPropagation();
    updateTask(task.id, 'delete', null);
  };

  const handleMoveTask = (e, direction) => {
    e.stopPropagation();
    updateTask(task.id, 'move', direction);
  };

  return (
    <>
      <Accordion
        expanded={task.depth < 2 && task.children?.length > 0 ? expanded.includes(`panel${task.id}`) : false}
        onChange={task.depth < 2 && task.children?.length > 0 ? handleChange(`panel${task.id}`) : undefined}
        TransitionProps={{ timeout: 300 }}
        sx={{
          mb: 1,
          boxShadow: '0px 2px 8px rgba(50, 98, 155, 0.2)',
          border: 'none !important',
          backgroundColor: 'white',
          '&.Mui-disabled': {
            backgroundColor: 'white',
            opacity: 1,
          },
        }}
      >
        <AccordionSummary
          expandIcon={
            task.depth < 2 && task.children?.length > 0 ? (
              <ExpandMoreIcon
                sx={{
                  mr: 3.75,
                  transform: expanded.includes(`panel${task.id}`) ? 'scaleY(-1)' : 'none',
                  transition: 'transform 0.3s ease',
                }}
              />
            ) : null
          }
          sx={{
            border: 'none !important',
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            },
            backgroundColor: 'white',
            '&.Mui-disabled': {
              backgroundColor: 'white',
              opacity: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
            {isEditMode && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {task.depth < 2 && (
                  <IconButton
                    onClick={handleAddChild}
                    size="small"
                    sx={{ color: 'grey.500' }}
                  >
                    <AddIcon />
                  </IconButton>
                )}
                <IconButton
                  onClick={handleDeleteTask}
                  size="small"
                  sx={{ color: 'grey.500' }}
                  disabled={task.depth === 0 && task.children?.length > 0}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  onClick={(e) => handleMoveTask(e, 'up')}
                  size="small"
                  sx={{ color: 'grey.500' }}
                  disabled={index === 0}
                >
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton
                  onClick={(e) => handleMoveTask(e, 'down')}
                  size="small"
                  sx={{ color: 'grey.500' }}
                  disabled={index === totalTasks - 1}
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </Box>
            )}
            <Box sx={{ flexShrink: 0, maxWidth: '450px', pl: task.depth * 2 }}>
              {isEditingTitle ? (
                <TextField
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTitleSubmit();
                    }
                  }}
                  size="small"
                  sx={{
                    width: '300px',
                    '& .MuiInputBase-input': {
                      fontSize: task.depth === 0 ? '1.15rem' : '0.95rem',
                      color: themeConstants.textColor,
                    },
                  }}
                />
              ) : (
                <Typography
                  onClick={handleTitleClick}
                  sx={{
                    fontSize: task.depth === 0 ? '1.15rem' : '0.95rem',
                    cursor: isEditMode ? 'pointer' : 'default',
                  }}
                >
                  {task.title}
                  {task.depth === 0 && task.percentage !== undefined && (
                    <Typography component="span" sx={{ color: 'grey.500', ml: 1 }}>
                      ({task.percentage}%)
                    </Typography>
                  )}
                </Typography>
              )}
            </Box>
            {task.depth > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Select
                  value={task.status || ''}
                  onChange={handleStatusChange}
                  onClick={handleDropdownClick}
                  size="small"
                  sx={{
                    minWidth: 145,
                    width: 125,
                    backgroundColor:
                      (task.status || '') === 'Missing' ? '#ffebee' :
                      (task.status || '') === 'Suboptimal' ? '#fff3e0' :
                      (task.status || '') === 'Inapplicable' ? '#f5f5f5' :
                      (task.status || '') === 'In Progress' ? '#e3f2fd' :
                      (task.status || '') === 'Testing' ? '#fce4ec' :
                      (task.status || '') === 'Done' ? '#e8f5e9' : themeConstants.fieldBackground,
                    '& .MuiSelect-select': {
                      color: themeConstants.textColor,
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: themeConstants.placeholderColor,
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderColor,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderHoverColor,
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderFocusedColor,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ backgroundColor: themeConstants.fieldBackground, color: themeConstants.placeholderColor }}>No Status</MenuItem>
                  <MenuItem value="Missing" sx={{ backgroundColor: '#ffebee', color: themeConstants.menuItemColor }}>Missing</MenuItem>
                  <MenuItem value="Suboptimal" sx={{ backgroundColor: '#fff3e0', color: themeConstants.menuItemColor }}>Suboptimal</MenuItem>
                  <MenuItem value="Inapplicable" sx={{ backgroundColor: '#f5f5f5', color: themeConstants.menuItemColor }}>Inapplicable</MenuItem>
                  <MenuItem value="In Progress" sx={{ backgroundColor: '#e3f2fd', color: themeConstants.menuItemColor }}>In Progress</MenuItem>
                  <MenuItem value="Testing" sx={{ backgroundColor: '#fce4ec', color: themeConstants.menuItemColor }}>Testing</MenuItem>
                  <MenuItem value="Done" sx={{ backgroundColor: '#e8f5e9', color: themeConstants.menuItemColor }}>Done</MenuItem>
                </Select>
                {['Missing', 'Suboptimal'].includes(task.status) && (
                  <TextField
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    onKeyPress={handleDateKeyPress('date', setTempDate)}
                    placeholder="Start Date"
                    size="small"
                    sx={{
                      width: 110,
                      backgroundColor: themeConstants.fieldBackground,
                      '& .MuiInputBase-input': {
                        color: themeConstants.textColor,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: themeConstants.placeholderColor,
                        opacity: 1,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderColor,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderHoverColor,
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderFocusedColor,
                      },
                    }}
                  />
                )}
                {task.status === 'In Progress' && (
                  <TextField
                    value={tempTestingDate}
                    onChange={(e) => setTempTestingDate(e.target.value)}
                    onKeyPress={handleDateKeyPress('testingDate', setTempTestingDate)}
                    placeholder="Testing Date"
                    size="small"
                    sx={{
                      width: 110,
                      backgroundColor: themeConstants.fieldBackground,
                      '& .MuiInputBase-input': {
                        color: themeConstants.textColor,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: themeConstants.placeholderColor,
                        opacity: 1,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderColor,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderHoverColor,
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderFocusedColor,
                      },
                    }}
                  />
                )}
                {task.status === 'Testing' && (
                  <TextField
                    value={tempResultsDate}
                    onChange={(e) => setTempResultsDate(e.target.value)}
                    onKeyPress={handleDateKeyPress('resultsDate', setTempResultsDate)}
                    placeholder="Results Date"
                    size="small"
                    sx={{
                      width: 110,
                      backgroundColor: themeConstants.fieldBackground,
                      '& .MuiInputBase-input': {
                        color: themeConstants.textColor,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: themeConstants.placeholderColor,
                        opacity: 1,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderColor,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderHoverColor,
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderFocusedColor,
                      },
                    }}
                  />
                )}
                {task.status === 'Done' && (
                  <TextField
                    value={tempQuarterlyDate}
                    onChange={(e) => setTempQuarterlyDate(e.target.value)}
                    onKeyPress={handleDateKeyPress('quarterlyDate', setTempQuarterlyDate)}
                    placeholder="Quarterly Date"
                    size="small"
                    sx={{
                      width: 110,
                      backgroundColor: themeConstants.fieldBackground,
                      '& .MuiInputBase-input': {
                        color: themeConstants.textColor,
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: themeConstants.placeholderColor,
                        opacity: 1,
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderColor,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderHoverColor,
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeConstants.borderFocusedColor,
                      },
                    }}
                  />
                )}
                <Select
                  value={task.assignee || ''}
                  onChange={handleAssigneeChange}
                  onClick={handleDropdownClick}
                  displayEmpty
                  size="small"
                  sx={{
                    minWidth: 120,
                    width: 120,
                    backgroundColor: themeConstants.fieldBackground,
                    '& .MuiSelect-select': {
                      color: task.assignee ? themeConstants.textColor : themeConstants.placeholderColor,
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: themeConstants.placeholderColor,
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderColor,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderHoverColor,
                    },
                    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeConstants.borderFocusedColor,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ color: themeConstants.placeholderColor }}>Assign</MenuItem>
                  <MenuItem value="Vlado" sx={{ color: themeConstants.menuItemColor }}>Vlado</MenuItem>
                  <MenuItem value="Petra" sx={{ color: themeConstants.menuItemColor }}>Petra</MenuItem>
                  <MenuItem value="Basti" sx={{ color: themeConstants.menuItemColor }}>Basti</MenuItem>
                  <MenuItem value="Matúš" sx={{ color: themeConstants.menuItemColor }}>Matúš</MenuItem>
                  <MenuItem value="Juro" sx={{ color: themeConstants.menuItemColor }}>Juro</MenuItem>
                </Select>
                <CustomTooltip title={task.note || 'No note'} placement="top" arrow>
                  <NoteIcon
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteDialogOpen(true);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: task.note ? 'primary.main' : 'grey.500',
                    }}
                  />
                </CustomTooltip>
              </Box>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            border: 'none !important',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, pl: task.depth * 2 }}>
            {task.children && task.children.map((child, childIndex) => (
              <Task
                key={child.id}
                task={child}
                updateTask={updateTask}
                isEditMode={isEditMode}
                index={childIndex}
                totalTasks={task.children.length}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <TextField
            multiline
            rows={4}
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            onKeyDown={handleNoteKeyPress}
            placeholder="Add a note (Shift+Enter for new line, Enter to save)"
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiInputBase-input': {
                color: themeConstants.textColor,
              },
              '& .MuiInputBase-input::placeholder': {
                color: themeConstants.placeholderColor,
                opacity: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: themeConstants.borderColor,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: themeConstants.borderHoverColor,
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: themeConstants.borderFocusedColor,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleNoteSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function App() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load initial projects from projectsData
  useEffect(() => {
    const initialProjects = projectsData.projects;
    const processedProjects = initialProjects.map(project => {
      const processedTasks = processTasks(project.tasks);
      const totalPercentage = processedTasks.reduce((sum, task) => sum + (task.percentage || 0), 0);
      const projectPercentage = processedTasks.length > 0 ? Math.round(totalPercentage / processedTasks.length) : 0;
      return {
        ...project,
        tasks: processedTasks,
        percentage: projectPercentage,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
    setProjects(processedProjects);
    if (processedProjects.length > 0) {
      setActiveProjectId(processedProjects[0].id);
    }
  }, []);

  // Function to save project to backend
  const saveProjectToFile = async (project) => {
    try {
      // Clean project data by removing derived fields
      const rawProject = {
        id: project.id,
        tasks: project.tasks.map(task => {
          const rawTask = { ...task };
          delete rawTask.percentage;
          delete rawTask.depth;
          if (rawTask.children) {
            rawTask.children = rawTask.children.map(child => {
              const rawChild = { ...child };
              delete rawChild.depth;
              if (rawChild.children) {
                rawChild.children = rawChild.children.map(grand => {
                  const rawGrand = { ...grand };
                  delete rawGrand.depth;
                  return rawGrand;
                });
              }
              return rawChild;
            });
          }
          return rawTask;
        }),
      };
      await axios.post(`http://localhost:5000/api/projects/${encodeURIComponent(project.name)}`, rawProject);
      console.log(`Saved project ${project.name} to file`);
    } catch (error) {
      console.error(`Error saving project ${project.name}:`, error);
    }
  };

  // Update task and save to file
  const updateTask = (taskId, field, value) => {
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(project => {
        if (project.id !== activeProjectId) return project;

        const updateNested = (tasks) => {
          return tasks.map(task => {
            if (task.id === taskId) {
              if (field === 'addChild') {
                return {
                  ...task,
                  children: task.children ? [...task.children, { ...value }] : [{ ...value }],
                };
              }
              if (field === 'delete') {
                return null;
              }
              if (field === 'move') {
                return { ...task }; // Handled by swapInParent
              }
              return { ...task, [field]: value };
            }
            if (task.children) {
              return { ...task, children: updateNested(task.children).filter(t => t !== null) };
            }
            return task;
          }).filter(t => t !== null);
        };

        let updatedTasks;
        if (field === 'move') {
          updatedTasks = swapInParent(project.tasks, taskId, value);
        } else {
          updatedTasks = updateNested(project.tasks);
        }

        const processedTasks = processTasks(updatedTasks);
        const totalPercentage = processedTasks.reduce((sum, task) => sum + (task.percentage || 0), 0);
        const projectPercentage = processedTasks.length > 0 ? Math.round(totalPercentage / processedTasks.length) : 0;
        const updatedProject = { ...project, tasks: processedTasks, percentage: projectPercentage };

        // Save to file only for the active project
        saveProjectToFile(updatedProject);

        return updatedProject;
      });
      return updatedProjects;
    });
  };

  // Add new category and save to file
  const handleAddCategory = (e) => {
    e.stopPropagation();
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(project => {
        if (project.id !== activeProjectId) return project;
        const newCategory = {
          id: Date.now() + Math.random(),
          title: 'New Category',
          priority: 3,
          children: [],
        };
        const updatedTasks = [...project.tasks, newCategory];
        const processedTasks = processTasks(updatedTasks);
        const totalPercentage = processedTasks.reduce((sum, task) => sum + (task.percentage || 0), 0);
        const projectPercentage = processedTasks.length > 0 ? Math.round(totalPercentage / processedTasks.length) : 0;
        const updatedProject = { ...project, tasks: processedTasks, percentage: projectPercentage };

        // Save to file
        saveProjectToFile(updatedProject);

        return updatedProject;
      });
      return updatedProjects;
    });
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: Math.min(projects.length, 3),
    slidesToScroll: 1,
    swipeToSlide: true,
    centerMode: true,
    centerPadding: '0px',
    variableWidth: true,
  };

  return (
    <GlobalStyles>
      <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: themeConstants.pageBackground }}>
        <Box
          sx={{
            width: 60,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
        >
          <IconButton
            onClick={() => setIsEditMode(!isEditMode)}
            sx={{ color: isEditMode ? 'primary.main' : 'grey.500' }}
          >
            <EditIcon />
          </IconButton>
          {isEditMode && (
            <IconButton
              onClick={handleAddCategory}
              sx={{ color: 'grey.500', mt: 1 }}
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>
        <Box sx={{ flexGrow: 1, maxWidth: 1100, mx: 'auto', p: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
          {projects.length > 0 ? (
            (() => {
              const activeProject = projects.find(project => project.id === activeProjectId) || projects[0];
              return (
                <>
                  <Typography variant="h4" sx={{ mb: 3, mt: 2.5, textAlign: 'center', fontWeight: 'bold', color: themeConstants.projectNameColor }}>
                    {activeProject.name} ({activeProject.percentage}%)
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    {activeProject.tasks.map((task, index) => (
                      <Task
                        key={task.id}
                        task={task}
                        updateTask={updateTask}
                        isEditMode={isEditMode}
                        index={index}
                        totalTasks={activeProject.tasks.length}
                      />
                    ))}
                  </Box>
                  <Box sx={{ py: 2, position: 'sticky', bottom: 0, backgroundColor: 'background.paper', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
                    <Slider {...settings} sx={{ width: '100%', maxWidth: 800 }}>
                      {projects.map(project => (
                        <Box key={project.id} sx={{ width: 200, px: 1, boxSizing: 'border-box' }}>
                          <Button
                            variant={project.id === activeProjectId ? 'contained' : 'outlined'}
                            onClick={() => setActiveProjectId(project.id)}
                            sx={{ width: 200, height: 40, minWidth: 200 }}
                          >
                            {project.name} ({project.percentage}%)
                          </Button>
                        </Box>
                      ))}
                    </Slider>
                  </Box>
                </>
              );
            })()
          ) : (
            <Typography>No projects available</Typography>
          )}
        </Box>
      </Box>
    </GlobalStyles>
  );
}

export default App;