import type {
  InstituteContact,
  InstituteInfo,
  InstituteLicenses,
  InstituteSeo,
  InstituteSocial,
  PaymentAccountSettings,
  SmsTemplatesReplace,
} from "@/contracts/settings";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import { emitDomainEvent } from "../domain-events";
import { apiError } from "../errors";
import { INSTITUTE_SETTINGS_ID } from "../seed/settings";
import { requireUser } from "../domain/users";
import { newId, nowIso, ok } from "../utils";

function auditSettingsUpdate(
  actorId: string | null,
  section: string,
  before: unknown,
  after: unknown,
) {
  emitDomainEvent(getDb(), {
    actorId,
    action: "update",
    entityType: "settings",
    entityId: INSTITUTE_SETTINGS_ID,
    diff: {
      before: { [section]: before },
      after: { [section]: after },
    },
  });
}

function getSettings() {
  const db = getDb();
  const settings = db.instituteSettings.get(INSTITUTE_SETTINGS_ID);
  if (!settings) {
    const first = db.instituteSettings.all()[0];
    if (!first) throw apiError.notFound("تنظیمات موسسه");
    return first;
  }
  return settings;
}

function touchUpdatedAt() {
  return nowIso();
}

export const settingsHandlers: RouteImplementations = {
  getInstituteSettings: defineRoute(() => ok(getSettings())),

  updateInstituteInfo: defineRoute<{ body: InstituteInfo }>(({ user, body }) => {
    const actor = requireUser(user);
    const current = getSettings();
    const updated = getDb().instituteSettings.update(current.id, {
      info: body,
      updatedAt: touchUpdatedAt(),
    });
    auditSettingsUpdate(actor.id, "info", current.info, updated.info);
    return ok(updated.info);
  }),

  updateInstituteContact: defineRoute<{ body: InstituteContact }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      const current = getSettings();
      const updated = getDb().instituteSettings.update(current.id, {
        contact: body,
        updatedAt: touchUpdatedAt(),
      });
      auditSettingsUpdate(actor.id, "contact", current.contact, updated.contact);
      return ok(updated.contact);
    },
  ),

  updateInstituteSocial: defineRoute<{ body: InstituteSocial }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      const current = getSettings();
      const updated = getDb().instituteSettings.update(current.id, {
        social: body,
        updatedAt: touchUpdatedAt(),
      });
      auditSettingsUpdate(actor.id, "social", current.social, updated.social);
      return ok(updated.social);
    },
  ),

  updateInstituteLicenses: defineRoute<{ body: InstituteLicenses }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      const current = getSettings();
      const licenses = body.items.map((item, index) => ({
        id: item.id ?? newId(),
        title: item.title,
        imageFileId: item.imageFileId,
        href: item.href ?? "#",
        order: item.order ?? index,
      }));
      const updated = getDb().instituteSettings.update(current.id, {
        licenses,
        updatedAt: touchUpdatedAt(),
      });
      auditSettingsUpdate(actor.id, "licenses", current.licenses, updated.licenses);
      return ok(updated.licenses);
    },
  ),

  updateInstituteSeo: defineRoute<{ body: InstituteSeo }>(({ user, body }) => {
    const actor = requireUser(user);
    const current = getSettings();
    const updated = getDb().instituteSettings.update(current.id, {
      seo: body,
      updatedAt: touchUpdatedAt(),
    });
    auditSettingsUpdate(actor.id, "seo", current.seo, updated.seo);
    return ok(updated.seo);
  }),

  updateInstituteSmsTemplates: defineRoute<{ body: SmsTemplatesReplace }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      const current = getSettings();
      const byKey = new Map(body.templates.map((item) => [item.key, item.body]));
      const smsTemplates = current.smsTemplates.map((template) => {
        const nextBody = byKey.get(template.key);
        return nextBody === undefined
          ? template
          : { ...template, body: nextBody };
      });
      const updated = getDb().instituteSettings.update(current.id, {
        smsTemplates,
        updatedAt: touchUpdatedAt(),
      });
      auditSettingsUpdate(
        actor.id,
        "smsTemplates",
        current.smsTemplates,
        updated.smsTemplates,
      );
      return ok(updated.smsTemplates);
    },
  ),

  updateInstitutePaymentAccount: defineRoute<{ body: PaymentAccountSettings }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      const current = getSettings();
      const updated = getDb().instituteSettings.update(current.id, {
        paymentAccount: body,
        updatedAt: touchUpdatedAt(),
      });
      auditSettingsUpdate(
        actor.id,
        "paymentAccount",
        current.paymentAccount,
        updated.paymentAccount,
      );
      return ok(updated.paymentAccount);
    },
  ),
};
