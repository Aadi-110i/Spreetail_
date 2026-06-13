'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const DEFAULT_PASSWORD_HASH = crypto.createHash('sha256').update('flat4b123').digest('hex');

export async function createGroup(formData: FormData) {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  const group = await prisma.group.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId,
          joinedAt: new Date(),
        },
      },
    },
  });

  redirect(`/dashboard/groups/${group.id}`);
}

export async function addMemberToGroup(formData: FormData) {
  const groupId = formData.get('groupId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const joinedAt = formData.get('joinedAt') as string;

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { name, email, password: DEFAULT_PASSWORD_HASH } });
  }

  // Check if already member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
  });

  if (!existing) {
    await prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
      },
    });
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
}

export async function removeMemberFromGroup(formData: FormData) {
  const groupId = formData.get('groupId') as string;
  const memberId = formData.get('memberId') as string;

  await prisma.groupMember.update({
    where: { id: memberId },
    data: { leftAt: new Date() },
  });

  revalidatePath(`/dashboard/groups/${groupId}`);
}
