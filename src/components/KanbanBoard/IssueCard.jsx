import React, { useState, useContext } from 'react'
import { UserContext, KanbanBoardContext } from '~/context'
import { useNavigate } from 'react-router-dom'
import { useDrag } from 'react-dnd'
import { HighPriorityIcon } from '~/components/HighPrioIcon'
import { LowPriorityIcon } from '~/components/LowPrioIcon'
import { MediumPriorityIcon } from '~/components/MediumPrioIcon'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { faGameConsoleHandheld } from '@fortawesome/pro-solid-svg-icons'

import * as api from '~/api'
import { toTitleCase } from '~/utils'

import {
  Card,
  CardContent,
  IconButton,
  Menu,
  Box,
  Grid,
  Typography,
  Divider,
  ListItemText,
  ListItemIcon,
  MenuItem,
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material'

import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import BugReportIcon from '@mui/icons-material/BugReport'
import SuggectionIcon from '@mui/icons-material/TipsAndUpdates'
import { dispatchAlert } from '~/store'

export const IssueCard = ({ issue, sx }) => {
  const [menuOpen, setMenuOpen] = useState(null)
  const userInfo = useContext(UserContext)
  const navigate = useNavigate()
  const { updateIssue, deleteIssue } = useContext(KanbanBoardContext)
  const issueSummary =
    issue.summary.charAt(0).toUpperCase() + issue.summary.slice(1)
  let project = userInfo.user.projects.find((value) => value)

  const hasMaintainer = project.roles.indexOf('maintainer') === 0 ? true : false

  const canEdit = hasMaintainer || issue.discord_id === userInfo.user.discord_id

  const handleCardDelete = () => {
    api
      .requests('delete', `/api/issue/${issue.id}`, {
        alert: true,
        alertMessage: `Successfully deleted "${
          issue.summary
        }" with status "${toTitleCase(issue.status)}"`,
      })
      .then(() => {
        deleteIssue(issue)
      })
  }

  const handleCardArchive = () => {
    if (issue.status === 'completed' || issue.status === "won't-fix") {
      issue.archived = !issue.archived

      if (issue.archived) {
        issue.status = 'reported'
      }

      updateIssue(issue)
    } else {
      dispatchAlert({
        message:
          'Status must be "Completed" or "Won\'t Fix" in order to archive',
        type: 'error',
      })
    }
  }

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: {
      issue: issue,
    },
    type: 'issue',
  }))

  let cardProps = { sx: { opacity: isDragging ? 0 : 1 } }

  if (!issue.archived && canEdit) {
    cardProps.ref = drag
  }

  return (
    <Card
      ref={preview}
      {...cardProps}
      sx={{
        ...sx,
        '&:hover': {
          boxShadow:
            canEdit && !issue.archived && !isDragging
              ? '0px 2px 15px 0px rgba(255,255,255,0.3)'
              : '',
        },
        ml: 1,
        mr: 1,
        opacity: isDragging ? 0.25 : 1,
        p: 0,
      }}
    >
      <CardContent
        sx={{
          cursor: canEdit && !issue.archived ? 'move' : '',
          mb: 0,
          paddingBottom: '16px !important',
          paddingTop: '8px !important',
          pl: 2,
          pr: 2,
        }}
      >
        {!userInfo && (
          <Grid container>
            <Grid item lg={12}>
              <Box
                component='h4'
                sx={{
                  mt: 1,
                }}
              >
                <Box
                  component='span'
                  onClick={() => navigate(`/issue/${issue.id}`)}
                  sx={{
                    '&:hover': {
                      // cursor: 'pointer',
                      opacity: [0.9, 0.8, 0.7],
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <Typography>{issueSummary}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
        <Grid container>
          <Grid item lg={10.5}>
            <Box
              component='h4'
              sx={{
                mt: 1,
              }}
            >
              <Box
                component='span'
                onClick={() => navigate(`/issue/${issue.id}`)}
                sx={{
                  '&:hover': {
                    cursor: 'pointer',
                    opacity: [0.9, 0.8, 0.7],
                    textDecoration: 'underline',
                  },
                }}
              >
                {issueSummary}
              </Box>
            </Box>
          </Grid>
          {userInfo && canEdit && (
            <Grid item lg={1.5} sx={{ pr: 1, textAlign: 'right' }}>
              <IconButton
                aria-controls={menuOpen ? 'menu' : undefined}
                aria-expanded={menuOpen ? 'true' : undefined}
                aria-haspopup='true'
                onClick={(e) => {
                  setMenuOpen(e.currentTarget)
                }}
                sx={{ pt: 1 }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={menuOpen}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                id='menu'
                onClick={() => setMenuOpen(null)}
                onClose={() => setMenuOpen(null)}
                open={Boolean(menuOpen)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              >
                <MenuItem onClick={handleCardArchive}>
                  <ListItemIcon>
                    {issue.archived ? (
                      <UnarchiveIcon color='warning' fontSize='small' />
                    ) : (
                      <ArchiveIcon color='warning' fontSize='small' />
                    )}
                  </ListItemIcon>
                  {issue.archived ? (
                    <ListItemText>Unarchive</ListItemText>
                  ) : (
                    <ListItemText>Archive</ListItemText>
                  )}
                </MenuItem>

                <Divider />
                <MenuItem onClick={handleCardDelete}>
                  <ListItemIcon>
                    <DeleteIcon color='error' fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </Grid>
          )}
        </Grid>
        <Grid
          container
          direction='row'
          justifyContent='space-between'
          spacing={1}
        >
          <Grid item justifyContent='left' sx={{ mt: 1 }}>
            <Stack direction='row' spacing={2}>
              {issue.type === 'bug' && (
                <Tooltip title='Bug'>
                  <span>
                    <BugReportIcon color='error' />
                  </span>
                </Tooltip>
              )}
              {issue.type === 'suggestion' && (
                <Tooltip title='Suggestion'>
                  <span>
                    <SuggectionIcon color='white' />
                  </span>
                </Tooltip>
              )}
              {issue.priority === 'low' && (
                <Tooltip title='Low Priority'>
                  <span>
                    <LowPriorityIcon color='info' />
                  </span>
                </Tooltip>
              )}
              {issue.priority === 'medium' && (
                <Tooltip title='Medium Priority'>
                  <span>
                    <MediumPriorityIcon color='warning' />
                  </span>
                </Tooltip>
              )}
              {issue.priority === 'high' && (
                <Tooltip title='High Priority'>
                  <span>
                    <HighPriorityIcon color='error' />
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Grid>
          <Grid item justifyContent='center' sx={{ mt: 1 }}>
            <Stack direction='row' spacing={2}>
              {issue.os && issue.os.indexOf('windows') > -1 && (
                <FontAwesomeIcon
                  icon={icon({ name: 'windows', style: 'brands' })}
                  size='lg'
                />
              )}
              {issue.os && issue.os.indexOf('macOS') > -1 && (
                <FontAwesomeIcon
                  icon={icon({ name: 'apple', style: 'brands' })}
                  size='lg'
                />
              )}
              {issue.os && issue.os.indexOf('linux') > -1 && (
                <FontAwesomeIcon
                  icon={icon({ name: 'linux', style: 'brands' })}
                  size='lg'
                />
              )}
              {issue.os && issue.os.indexOf('handheld') > -1 && (
                <FontAwesomeIcon icon={faGameConsoleHandheld} size='lg' />
              )}
            </Stack>
          </Grid>
          <Grid item justifyContent='right' sx={{ mt: 1 }}>
            <Tooltip title='Version'>
              <span>
                <Typography variant='button'>{issue.version}</Typography>
              </span>
            </Tooltip>
          </Grid>

          <Grid item justifyContent='right'>
            <Avatar
              src={`https://cdn.discordapp.com/avatars/${issue.discord_id}/${issue.playerData.avatar}.png`}
              sx={{
                mr: 1,
                mt: 0.7,
                // cursor: "pointer",
                // ":hover": {
                //   boxShadow:
                //     "0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0.12)",
                // },
              }}
              // onClick={() => navigate(`/user/${issue.discord_id}`)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}