const AuditLog = require('../models/audit-log.model');

const logAuditEvent = async ({ actorId = null, actionType, targetEntity, targetId = null, metadata = {} }) => {
  if (!actionType || !targetEntity) {
    throw new Error('actorId, actionType, and targetEntity are required for audit logging.');
  }
  return AuditLog.create({
    actor_id: actorId,
    action_type: actionType,
    target_entity: targetEntity,
    target_id: targetId,
    metadata
  });
};

module.exports = {
  logAuditEvent
};
