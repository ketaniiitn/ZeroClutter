import prisma from '../../config/database';

const generateSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || 'workspace'}-${suffix}`;
};

export const createWorkspace = async (userId: string, name: string) => {
  const slug = generateSlug(name);

  return prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  });
};

export const getWorkspacesForUser = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { joinedAt: 'asc' },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    planTier: m.workspace.planTier,
    role: m.role as 'OWNER' | 'ADMIN' | 'MEMBER',
  }));
};

export const getWorkspaceMembership = async (userId: string, workspaceId: string) => {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
};
