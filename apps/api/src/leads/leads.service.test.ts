import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service.js';

describe('LeadsService tenant isolation', () => {
  it('always scopes list queries to the authenticated organization', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new LeadsService({ lead: { findMany } } as never);
    await service.list({userId:'user-a',organizationId:'organization-a',sessionId:'session-a',role:'OWNER'}, 25);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'organization-a' } }));
  });

  it('does not return a lead found outside the authenticated organization', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = new LeadsService({ lead: { findFirst } } as never);
    await expect(service.get('organization-a', 'lead-owned-by-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'lead-owned-by-b', organizationId: 'organization-a' } }));
  });
  it('limits agents to leads assigned to themselves',async()=>{const findMany=vi.fn().mockResolvedValue([]);const service=new LeadsService({lead:{findMany}} as never);await service.list({userId:'agent-a',organizationId:'organization-a',sessionId:'session-a',role:'AGENT'});expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({organizationId:'organization-a',assignedUserId:'agent-a'})}))});
});
