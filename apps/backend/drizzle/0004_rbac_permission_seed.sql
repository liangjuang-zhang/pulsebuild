-- =============================================
-- RBAC Seed: Roles, Permissions, Role-Permission Mappings
-- Aligned with Wiki: 权限管理 - Access permissions for project management
-- Roles: admin (system), builder / contractor / worker (project)
-- =============================================

-- 1. Roles
INSERT INTO "sys_role" ("id", "code", "name", "description", "type", "level", "is_active", "is_builtin", "created_at", "updated_at")
VALUES
	('role_admin',      'admin',      '系统管理员', '系统管理员，拥有全部系统与项目权限', 'system',  1,  true, true, now(), now()),
	('role_builder',    'builder',    '建设方',     '项目创建者与最高管理者，拥有项目全部权限', 'project', 10, true, true, now(), now()),
	('role_contractor', 'contractor', '承包商',     '任务执行者，管理自己被分配的任务与子任务', 'project', 20, true, true, now(), now()),
	('role_worker',     'worker',     '工人',       '子任务执行者，操作自己被分配的子任务',     'project', 30, true, true, now(), now())
ON CONFLICT ("code") DO UPDATE
SET
	"name" = EXCLUDED."name",
	"description" = EXCLUDED."description",
	"type" = EXCLUDED."type",
	"level" = EXCLUDED."level",
	"is_active" = EXCLUDED."is_active",
	"is_builtin" = EXCLUDED."is_builtin",
	"updated_at" = now();

-- 2. Permissions
INSERT INTO "sys_permission" ("id", "code", "name", "type", "parent_id", "order_index", "description", "is_active", "created_at", "updated_at")
VALUES
	-- System: role management
	('perm_system_role_list',       'system.role.list',       '查看角色列表',   'api', NULL, 100, '查看角色列表',             true, now(), now()),
	('perm_system_role_detail',     'system.role.detail',     '查看角色详情',   'api', NULL, 101, '查看角色详情（含权限）',   true, now(), now()),
	('perm_system_role_create',     'system.role.create',     '创建角色',       'api', NULL, 102, '创建新角色',              true, now(), now()),
	('perm_system_role_update',     'system.role.update',     '更新角色',       'api', NULL, 103, '修改角色信息',            true, now(), now()),
	('perm_system_role_delete',     'system.role.delete',     '删除角色',       'api', NULL, 104, '删除角色',                true, now(), now()),
	('perm_system_role_assign',     'system.role.assign',     '分配权限给角色', 'api', NULL, 105, '为角色分配权限（全量覆盖）', true, now(), now()),

	-- System: permission management
	('perm_system_perm_list',       'system.permission.list',   '查看权限列表', 'api', NULL, 120, '查看权限列表（扁平）',     true, now(), now()),
	('perm_system_perm_tree',       'system.permission.tree',   '查看权限树',   'api', NULL, 121, '查看权限树结构',           true, now(), now()),
	('perm_system_perm_create',     'system.permission.create', '创建权限',     'api', NULL, 122, '创建新权限',               true, now(), now()),
	('perm_system_perm_update',     'system.permission.update', '更新权限',     'api', NULL, 123, '修改权限信息',             true, now(), now()),
	('perm_system_perm_delete',     'system.permission.delete', '删除权限',     'api', NULL, 124, '删除权限',                 true, now(), now()),

	-- System: user role management
	('perm_system_urole_list',      'system.user.role.list',        '查看用户角色',   'api', NULL, 140, '查看用户角色列表',     true, now(), now()),
	('perm_system_urole_perms',     'system.user.role.permissions', '查看用户权限',   'api', NULL, 141, '查看用户实际权限',     true, now(), now()),
	('perm_system_urole_assign',    'system.user.role.assign',      '分配用户角色',   'api', NULL, 142, '为用户分配角色',       true, now(), now()),
	('perm_system_urole_remove',    'system.user.role.remove',      '移除用户角色',   'api', NULL, 143, '移除用户角色',         true, now(), now()),

	-- Project
	('perm_project_read',           'project.read',           '查看项目',       'api', NULL, 300, '查看项目信息',   true, now(), now()),
	('perm_project_create',         'project.create',         '创建项目',       'api', NULL, 310, '创建项目',       true, now(), now()),
	('perm_project_update',         'project.update',         '更新项目',       'api', NULL, 320, '编辑项目信息',   true, now(), now()),
	('perm_project_delete',         'project.delete',         '删除项目',       'api', NULL, 330, '删除或归档项目', true, now(), now()),

	-- Project members
	('perm_project_member_read',    'project.member.read',    '查看项目成员',   'api', NULL, 340, '查看成员列表',   true, now(), now()),
	('perm_project_member_add',     'project.member.add',     '添加项目成员',   'api', NULL, 350, '添加项目成员',   true, now(), now()),
	('perm_project_member_update',  'project.member.update',  '更新项目成员',   'api', NULL, 360, '调整成员角色',   true, now(), now()),
	('perm_project_member_remove',  'project.member.remove',  '移除项目成员',   'api', NULL, 370, '移除项目成员',   true, now(), now()),

	-- Tasks
	('perm_task_read',              'task.read',              '查看任务',       'api', NULL, 400, '查看任务列表与详情', true, now(), now()),
	('perm_task_create',            'task.create',            '创建任务',       'api', NULL, 410, '创建任务',          true, now(), now()),
	('perm_task_update',            'task.update',            '更新任务',       'api', NULL, 420, '更新任务信息',      true, now(), now()),
	('perm_task_delete',            'task.delete',            '删除任务',       'api', NULL, 430, '删除任务',          true, now(), now()),
	('perm_task_assign',            'task.assign',            '分派任务',       'api', NULL, 440, '分派任务负责人',    true, now(), now()),

	-- Subtasks
	('perm_subtask_create',         'subtask.create',         '创建子任务',     'api', NULL, 450, '创建子任务',        true, now(), now()),
	('perm_subtask_read',           'subtask.read',           '查看子任务',     'api', NULL, 455, '查看子任务详情',    true, now(), now()),
	('perm_subtask_update',         'subtask.update',         '更新子任务',     'api', NULL, 460, '更新子任务',        true, now(), now()),
	('perm_subtask_delete',         'subtask.delete',         '删除子任务',     'api', NULL, 470, '删除子任务',        true, now(), now()),
	('perm_subtask_assign',         'subtask.assign',         '分配子任务',     'api', NULL, 475, '将子任务分配给工人', true, now(), now()),

	-- Defects
	('perm_defect_read',            'defect.read',            '查看缺陷',       'api', NULL, 500, '查看缺陷信息',          true, now(), now()),
	('perm_defect_create',          'defect.create',          '创建缺陷',       'api', NULL, 510, '创建缺陷',              true, now(), now()),
	('perm_defect_update',          'defect.update',          '更新缺陷',       'api', NULL, 520, '更新缺陷信息',          true, now(), now()),
	('perm_defect_delete',          'defect.delete',          '删除缺陷',       'api', NULL, 530, '删除缺陷',              true, now(), now()),
	('perm_defect_status',          'defect.status.update',   '更新缺陷状态',   'api', NULL, 540, '更新缺陷状态与处理流程', true, now(), now()),

	-- Updates (progress notes)
	('perm_update_create',          'update.create',          '添加进度备注',   'api', NULL, 600, '为任务/子任务添加进度备注', true, now(), now()),
	('perm_update_read',            'update.read',            '查看进度备注',   'api', NULL, 610, '查看任务/子任务的备注',     true, now(), now()),
	('perm_update_edit',            'update.edit',            '编辑进度备注',   'api', NULL, 620, '编辑自己的进度备注',        true, now(), now()),
	('perm_update_delete',          'update.delete',          '删除进度备注',   'api', NULL, 630, '删除自己的进度备注',        true, now(), now()),

	-- Dependencies
	('perm_dependency_create',      'dependency.create',      '创建依赖关系',   'api', NULL, 700, '定义任务/子任务间依赖',   true, now(), now()),
	('perm_dependency_read',        'dependency.read',        '查看依赖关系',   'api', NULL, 710, '查看依赖关系列表',        true, now(), now()),
	('perm_dependency_delete',      'dependency.delete',      '删除依赖关系',   'api', NULL, 720, '删除依赖关系',            true, now(), now()),

	-- Timesheets
	('perm_timesheet_clock',        'timesheet.clock',        '打卡',           'api', NULL, 800, '上下班打卡',              true, now(), now()),
	('perm_timesheet_read',         'timesheet.read',         '查看工时',       'api', NULL, 810, '查看工时记录',            true, now(), now()),
	('perm_timesheet_update',       'timesheet.update',       '管理工时',       'api', NULL, 820, '编辑/更正工时记录',       true, now(), now()),
	('perm_timesheet_settings',     'timesheet.settings',     '工时设置',       'api', NULL, 830, '配置围栏与工时规则',      true, now(), now()),

	-- Site diaries
	('perm_diary_create',           'diary.create',           '创建现场日记',   'api', NULL, 900, '创建每日现场日记',        true, now(), now()),
	('perm_diary_read',             'diary.read',             '查看现场日记',   'api', NULL, 910, '查看现场日记列表与详情',  true, now(), now()),
	('perm_diary_update',           'diary.update',           '编辑现场日记',   'api', NULL, 920, '编辑现场日记',            true, now(), now()),
	('perm_diary_delete',           'diary.delete',           '删除现场日记',   'api', NULL, 930, '删除现场日记',            true, now(), now()),

	-- Documents
	('perm_document_upload',        'document.upload',        '上传文件',       'api', NULL, 1000, '上传项目/任务/子任务文件', true, now(), now()),
	('perm_document_read',          'document.read',          '查看文件',       'api', NULL, 1010, '查看/下载文件',            true, now(), now()),
	('perm_document_delete',        'document.delete',        '删除文件',       'api', NULL, 1020, '删除文件',                 true, now(), now())
ON CONFLICT ("code") DO UPDATE
SET
	"name" = EXCLUDED."name",
	"type" = EXCLUDED."type",
	"parent_id" = EXCLUDED."parent_id",
	"order_index" = EXCLUDED."order_index",
	"description" = EXCLUDED."description",
	"is_active" = EXCLUDED."is_active",
	"updated_at" = now();

-- 3. Role-Permission Mappings (based on Wiki permission matrix)
WITH mappings (role_code, permission_code) AS (
	VALUES
		-- ===== admin: all permissions =====
		('admin', 'system.role.list'),
		('admin', 'system.role.detail'),
		('admin', 'system.role.create'),
		('admin', 'system.role.update'),
		('admin', 'system.role.delete'),
		('admin', 'system.role.assign'),
		('admin', 'system.permission.list'),
		('admin', 'system.permission.tree'),
		('admin', 'system.permission.create'),
		('admin', 'system.permission.update'),
		('admin', 'system.permission.delete'),
		('admin', 'system.user.role.list'),
		('admin', 'system.user.role.permissions'),
		('admin', 'system.user.role.assign'),
		('admin', 'system.user.role.remove'),
		('admin', 'project.read'),
		('admin', 'project.create'),
		('admin', 'project.update'),
		('admin', 'project.delete'),
		('admin', 'project.member.read'),
		('admin', 'project.member.add'),
		('admin', 'project.member.update'),
		('admin', 'project.member.remove'),
		('admin', 'task.read'),
		('admin', 'task.create'),
		('admin', 'task.update'),
		('admin', 'task.delete'),
		('admin', 'task.assign'),
		('admin', 'subtask.create'),
		('admin', 'subtask.read'),
		('admin', 'subtask.update'),
		('admin', 'subtask.delete'),
		('admin', 'subtask.assign'),
		('admin', 'defect.read'),
		('admin', 'defect.create'),
		('admin', 'defect.update'),
		('admin', 'defect.delete'),
		('admin', 'defect.status.update'),
		('admin', 'update.create'),
		('admin', 'update.read'),
		('admin', 'update.edit'),
		('admin', 'update.delete'),
		('admin', 'dependency.create'),
		('admin', 'dependency.read'),
		('admin', 'dependency.delete'),
		('admin', 'timesheet.clock'),
		('admin', 'timesheet.read'),
		('admin', 'timesheet.update'),
		('admin', 'timesheet.settings'),
		('admin', 'diary.create'),
		('admin', 'diary.read'),
		('admin', 'diary.update'),
		('admin', 'diary.delete'),
		('admin', 'document.upload'),
		('admin', 'document.read'),
		('admin', 'document.delete'),

		-- ===== builder: project-level full access =====
		('builder', 'project.read'),
		('builder', 'project.create'),
		('builder', 'project.update'),
		('builder', 'project.delete'),
		('builder', 'project.member.read'),
		('builder', 'project.member.add'),
		('builder', 'project.member.update'),
		('builder', 'project.member.remove'),
		('builder', 'task.read'),
		('builder', 'task.create'),
		('builder', 'task.update'),
		('builder', 'task.delete'),
		('builder', 'task.assign'),
		('builder', 'subtask.create'),
		('builder', 'subtask.read'),
		('builder', 'subtask.update'),
		('builder', 'subtask.delete'),
		('builder', 'subtask.assign'),
		('builder', 'defect.read'),
		('builder', 'defect.create'),
		('builder', 'defect.update'),
		('builder', 'defect.delete'),
		('builder', 'defect.status.update'),
		('builder', 'update.create'),
		('builder', 'update.read'),
		('builder', 'update.edit'),
		('builder', 'update.delete'),
		('builder', 'dependency.create'),
		('builder', 'dependency.read'),
		('builder', 'dependency.delete'),
		('builder', 'timesheet.clock'),
		('builder', 'timesheet.read'),
		('builder', 'timesheet.update'),
		('builder', 'timesheet.settings'),
		('builder', 'diary.create'),
		('builder', 'diary.read'),
		('builder', 'diary.update'),
		('builder', 'diary.delete'),
		('builder', 'document.upload'),
		('builder', 'document.read'),
		('builder', 'document.delete'),

		-- ===== contractor: own tasks + subtasks, scoped access =====
		('contractor', 'project.read'),
		('contractor', 'project.member.read'),
		('contractor', 'task.read'),
		-- contractor cannot create/delete tasks, only builder can
		('contractor', 'subtask.create'),       -- on own tasks
		('contractor', 'subtask.read'),
		('contractor', 'subtask.update'),       -- on own tasks
		('contractor', 'subtask.delete'),       -- on own tasks
		('contractor', 'subtask.assign'),       -- assign workers on own tasks
		('contractor', 'defect.read'),
		('contractor', 'defect.create'),        -- on own tasks
		('contractor', 'defect.update'),        -- own defects
		('contractor', 'defect.status.update'), -- resolve defects
		('contractor', 'update.create'),        -- on own task scope
		('contractor', 'update.read'),
		('contractor', 'update.edit'),          -- own updates
		('contractor', 'update.delete'),        -- own updates
		('contractor', 'dependency.create'),    -- at least one side is own task
		('contractor', 'dependency.read'),
		('contractor', 'dependency.delete'),
		('contractor', 'timesheet.clock'),      -- self
		('contractor', 'timesheet.read'),       -- own workers
		('contractor', 'timesheet.update'),     -- own workers
		('contractor', 'diary.read'),           -- read only, no signature
		('contractor', 'document.upload'),      -- on own tasks
		('contractor', 'document.read'),
		('contractor', 'document.delete'),      -- own uploads

		-- ===== worker: assigned subtasks only =====
		('worker', 'project.read'),
		('worker', 'task.read'),                -- filtered to tasks with own subtasks
		('worker', 'subtask.read'),             -- own assigned subtasks
		('worker', 'defect.read'),              -- on own subtasks
		('worker', 'defect.create'),            -- on own subtasks
		('worker', 'defect.update'),            -- own defects only
		('worker', 'defect.delete'),            -- own defects only
		('worker', 'update.create'),            -- on own subtasks
		('worker', 'update.read'),
		('worker', 'update.edit'),              -- own updates
		('worker', 'update.delete'),            -- own updates
		('worker', 'timesheet.clock'),          -- self
		('worker', 'timesheet.read'),           -- own only
		('worker', 'document.read')             -- own subtask + parent task docs
)
INSERT INTO "sys_role_permission" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", now()
FROM mappings m
INNER JOIN "sys_role" r ON r."code" = m.role_code
INNER JOIN "sys_permission" p ON p."code" = m.permission_code
ON CONFLICT ("role_id", "permission_id") DO NOTHING;