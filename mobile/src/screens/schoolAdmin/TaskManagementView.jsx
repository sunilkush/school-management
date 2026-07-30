import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Menu, ProgressBar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { SearchField } from '../../components/ui/SearchField';
import { Panel } from '../../components/ui/Panel';
import { CreateTaskSheet } from './CreateTaskSheet';
import { formatDate, formatDateOnly } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeleteTaskMutation, useGetMyTasksQuery, useUpdateTaskMutation } from '../../store/api/apiSlice';

const STATUS_COLOR = { todo: '#94A3B8', in_progress: '#F59E0B', done: '#22C55E', cancelled: '#64748B' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' };
const STATUSES = Object.keys(STATUS_LABEL);
const PRIORITY_COLOR = { low: '#64748B', medium: '#D97706', high: '#EA580C', urgent: '#DC2626' };
const PRIORITIES = Object.keys(PRIORITY_COLOR);
const STATUS_FILTERS = [{ value: null, label: 'All' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))];
const PRIORITY_FILTERS = [{ value: null, label: 'All' }, ...PRIORITIES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))];
const OVERDUE_COLOR = '#EF4444';

function isOverdue(task) {
  return Boolean(task.dueDate) && task.dueDate.slice(0, 10) < formatDateOnly(new Date()) && task.status !== 'done' && task.status !== 'cancelled';
}

/** Tap-to-open menu chip for changing a task's priority right from the list, without opening the
 * full Edit sheet — the same "single tap, instant save" pattern StatusPicker already gives
 * attendance rows, just scoped to priority instead of a hardcoded attendance-status set. */
function PriorityPicker({ value, onChange, disabled }) {
  const [visible, setVisible] = useState(false);
  const color = PRIORITY_COLOR[value] || '#94A3B8';
  const label = value ? value[0].toUpperCase() + value.slice(1) : 'Priority';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Chip compact disabled={disabled} onPress={() => setVisible(true)} style={{ backgroundColor: `${color}22` }} textStyle={{ color }}>
          {label}
        </Chip>
      }
    >
      {PRIORITIES.map((p) => (
        <Menu.Item
          key={p}
          title={p[0].toUpperCase() + p.slice(1)}
          onPress={() => {
            onChange(p);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}

/** Same tap-to-open pattern as PriorityPicker, scoped to task status — replaces the old "Advance"
 * button that only ever moved status one fixed step forward (and confusingly wrapped cancelled
 * back to todo); this lets you jump straight to any status, same as web's own Status dropdown. */
function TaskStatusPicker({ value, onChange, disabled }) {
  const [visible, setVisible] = useState(false);
  const color = STATUS_COLOR[value] || '#94A3B8';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Chip compact disabled={disabled} onPress={() => setVisible(true)} style={{ backgroundColor: `${color}22` }} textStyle={{ color }}>
          {STATUS_LABEL[value] ?? value}
        </Chip>
      }
    >
      {STATUSES.map((s) => (
        <Menu.Item
          key={s}
          title={STATUS_LABEL[s]}
          onPress={() => {
            onChange(s);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}

/** School Admin's task management — GET /tasks already returns every task in the school for this
 * role (listTasks only scopes to assignedTo for non-admins), so the "all tasks" view is the same
 * endpoint Teacher's MyTasksView reads, just unfiltered. Mirrors web's TaskManagement.jsx KPIs/
 * overdue-detection/search/priority-filter — web's drag-and-drop Kanban board itself isn't ported
 * (no drag-and-drop equivalent on a phone list); status and priority are instead changed with a
 * single tap via TaskStatusPicker/PriorityPicker right on each card (same "jump to any value, not
 * a forced sequence" model as web's own dropdowns), with the full Edit sheet still there for
 * everything else (title/description/due date/assignees). */
export function TaskManagementView() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [priority, setPriority] = useState(null);
  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // School Admin sees every task in the school (not just self-assigned), so the backend's
  // default limit=50 with no override was a real truncation risk here — missed in the earlier
  // pagination pass since this call wasn't parameterless.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyTasksQuery({ status: status || undefined, limit: 500 });
  const tasks = data ?? [];
  const [deleteTask, deleteState] = useDeleteTaskMutation();
  const [updateTask, updateState] = useUpdateTaskMutation();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesPriority = !priority || t.priority === priority;
      const matchesSearch = !query || `${t.title} ${t.description ?? ''}`.toLowerCase().includes(query);
      return matchesPriority && matchesSearch;
    });
  }, [tasks, priority, search]);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done').length;
    return {
      total: tasks.length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done,
      overdue: tasks.filter(isOverdue).length,
      completionPct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const openCreate = () => {
    setEditingTask(null);
    setSheetVisible(true);
  };
  const openEdit = (task) => {
    setEditingTask(task);
    setSheetVisible(true);
  };
  const closeSheet = () => {
    setSheetVisible(false);
    setEditingTask(null);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="format-list-checks" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Task Management</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Assign, track and manage tasks across the school
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total Tasks" metric={{ value: stats.total, icon: 'clipboard-text-outline', color: '#7C3AED' }} />
          <StatCard label="In Progress" metric={{ value: stats.inProgress, icon: 'sync', color: '#2563EB' }} />
          <StatCard label="Completed" metric={{ value: stats.done, icon: 'check-circle-outline', color: '#10B981' }} />
          <StatCard label="Overdue" metric={{ value: stats.overdue, icon: 'clock-alert-outline', color: OVERDUE_COLOR }} />
        </StatGrid>
      </View>

      {tasks.length > 0 && (
        <Panel>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Completion</Text>
            <Text style={[typography.bodyStrong, { color: '#10B981' }]}>{stats.completionPct}%</Text>
          </View>
          <ProgressBar progress={stats.completionPct / 100} color="#10B981" style={{ height: 8, borderRadius: 4 }} />
        </Panel>
      )}

      <Panel>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search tasks" style={{ marginBottom: spacing.sm }} />

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          {STATUS_FILTERS.map((opt) => (
            <Chip key={opt.label} selected={status === opt.value} onPress={() => setStatus(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </ScrollView>

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>PRIORITY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
          {PRIORITY_FILTERS.map((opt) => (
            <Chip key={opt.label} selected={priority === opt.value} onPress={() => setPriority(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </ScrollView>
      </Panel>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={openCreate}>
          New Task
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="format-list-checks"
        emptyLabel={tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
      >
        {filtered.map((task) => {
          const overdue = isOverdue(task);
          return (
            <AccentListCard
              key={task._id}
              accent={overdue ? OVERDUE_COLOR : STATUS_COLOR[task.status]}
              avatar={<IconWell icon="format-list-checks" color={overdue ? OVERDUE_COLOR : PRIORITY_COLOR[task.priority] || colors.primary} size={40} />}
              title={task.title}
              subtitle={task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              badge={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {overdue && <StatusPill label="Overdue" color={OVERDUE_COLOR} />}
                  <TaskStatusPicker
                    value={task.status}
                    disabled={updateState.isLoading}
                    onChange={(s) => updateTask({ id: task._id, status: s })}
                  />
                </View>
              }
              meta={[
                ...(task.description ? [{ label: 'Description', value: task.description }] : []),
                {
                  label: 'Assigned To',
                  value: task.assignedTo?.length ? task.assignedTo.map((u) => u.name).join(', ') : 'Unassigned',
                },
              ]}
              actions={
                <>
                  <PriorityPicker
                    value={task.priority}
                    disabled={updateState.isLoading}
                    onChange={(p) => updateTask({ id: task._id, priority: p })}
                  />
                  <IconButton icon="pencil-outline" size={18} onPress={() => openEdit(task)} />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={deleteState.isLoading}
                    onPress={() => confirmDelete(() => deleteTask(task._id), 'this task')}
                  />
                </>
              }
              expandable
            />
          );
        })}
      </QueryState>

      <CreateTaskSheet visible={sheetVisible} editing={editingTask} onDismiss={closeSheet} onCreated={closeSheet} />
    </ScreenContainer>
  );
}
