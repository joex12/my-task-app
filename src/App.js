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
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { styled } from '@mui/material/styles';
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

// Process tasks to add IDs and depth
const processTasks = (tasks, depth = 0, idCounter = { current: 1 }) => {
  return tasks.map(task => ({
    ...task,
    id: idCounter.current++,
    depth,
    children: task.children ? processTasks(task.children, depth + 1, idCounter) : undefined,
  }));
};

// Task component
function Task({ task, updateTask }) {
  const [expanded, setExpanded] = useState([]);
  const [tempDate, setTempDate] = useState(task.date || '');
  const [tempNote, setTempNote] = useState(task.note || '');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

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

  const handleDateSubmit = (value) => {
    const formatted = formatDate(value);
    if (formatted !== task.date) {
      updateTask(task.id, 'date', formatted);
      setTempDate(formatted);
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

  const handleDateKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleDateSubmit(e.target.value);
    }
  };

  const handleAssigneeChange = (e) => {
    updateTask(task.id, 'assignee', e.target.value);
  };

  const handleStatusChange = (e) => {
    updateTask(task.id, 'status', e.target.value);
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
            <Typography
              sx={{
                flexShrink: 0,
                maxWidth: '450px',
                pl: task.depth * 2,
                fontSize: task.depth === 0 ? '1.15rem' : '0.95rem',
              }}
            >
              {task.title}
            </Typography>
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
                    backgroundColor: (task.status || '') === 'Missing' ? '#ffebee' :
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
                <TextField
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  onKeyPress={handleDateKeyPress}
                  onClick={handleDropdownClick}
                  placeholder="Date"
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
            {task.children && task.children.map(child => (
              <Task key={child.id} task={child} updateTask={updateTask} />
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

  useEffect(() => {
    const processedProjects = projectsData.projects.map(project => ({
      ...project,
      tasks: processTasks(project.tasks),
    }));
    setProjects(processedProjects);
    if (processedProjects.length > 0) {
      setActiveProjectId(processedProjects[0].id);
    }
  }, []);

  const activeProject = projects.find(project => project.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);

  const updateTask = (taskId, field, value) => {
    setProjects(prevProjects => prevProjects.map(project => {
      if (project.id !== activeProjectId) return project;
      const updateNested = (tasks) =>
        tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, [field]: value };
          }
          if (task.children) {
            return { ...task, children: updateNested(task.children) };
          }
          return task;
        });
      return { ...project, tasks: updateNested(project.tasks) };
    }));
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
      <Box sx={{ width: '100vw', minHeight: '100vh', backgroundColor: themeConstants.pageBackground }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
          {activeProject ? (
            <>
              <Typography variant="h4" sx={{ mb: 3, mt: 2.5, textAlign: 'center', fontWeight: 'bold', color: themeConstants.projectNameColor }}>
                {activeProject.name}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                {activeProject.tasks.map(task => (
                  <Task
                    key={task.id}
                    task={task}
                    updateTask={(taskId, field, value) => updateTask(taskId, field, value)}
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
                        {project.name}
                      </Button>
                    </Box>
                  ))}
                </Slider>
              </Box>
            </>
          ) : (
            <Typography>No projects available</Typography>
          )}
        </Box>
      </Box>
    </GlobalStyles>
  );
}

export default App;