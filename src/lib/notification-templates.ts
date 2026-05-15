import type { SupportedLanguage } from "./constants";

export type NotificationType =
  | "application_submitted"
  | "payment_received"
  | "missing_items"
  | "status_change"
  | "sire_approval_request"
  | "sire_approved"
  | "sire_denied"
  | "application_approved"
  | "application_rejected";

export interface NotificationTemplate {
  subject: string;
  body: string;
}

const templates: Record<
  NotificationType,
  Record<SupportedLanguage, NotificationTemplate>
> = {
  application_submitted: {
    en: {
      subject: "Application Received — {{horse_name}}",
      body: "Your application for {{horse_name}} has been submitted. We will review it shortly. Application ID: {{application_id}}.",
    },
    es: {
      subject: "Solicitud Recibida — {{horse_name}}",
      body: "Su solicitud para {{horse_name}} ha sido enviada. La revisaremos en breve. ID de solicitud: {{application_id}}.",
    },
  },
  payment_received: {
    en: {
      subject: "Payment Confirmed — {{horse_name}}",
      body: "We have received your payment of {{amount}} for {{horse_name}}. Your application is now in review.",
    },
    es: {
      subject: "Pago Confirmado — {{horse_name}}",
      body: "Hemos recibido su pago de {{amount}} para {{horse_name}}. Su solicitud está ahora en revisión.",
    },
  },
  missing_items: {
    en: {
      subject: "Action Required — {{horse_name}}",
      body: "Your application for {{horse_name}} is missing the following items: {{items}}. Please submit them to continue processing.",
    },
    es: {
      subject: "Acción Requerida — {{horse_name}}",
      body: "Su solicitud para {{horse_name}} necesita los siguientes documentos: {{items}}. Por favor envíelos para continuar el procesamiento.",
    },
  },
  status_change: {
    en: {
      subject: "Application Update — {{horse_name}}",
      body: "The status of your application for {{horse_name}} has been updated to: {{status}}.",
    },
    es: {
      subject: "Actualización de Solicitud — {{horse_name}}",
      body: "El estado de su solicitud para {{horse_name}} ha sido actualizado a: {{status}}.",
    },
  },
  sire_approval_request: {
    en: {
      subject: "Sire Approval Requested — {{horse_name}}",
      body: "A registration application for {{horse_name}} lists {{sire_name}} as the sire. Please review and approve or deny this claim. Click here to respond: {{approval_link}}",
    },
    es: {
      subject: "Aprobación del Semental Solicitada — {{horse_name}}",
      body: "Una solicitud de registro para {{horse_name}} indica {{sire_name}} como semental. Por favor revise y apruebe o rechace esta solicitud. Haga clic aquí para responder: {{approval_link}}",
    },
  },
  sire_approved: {
    en: {
      subject: "Sire Approved — {{horse_name}}",
      body: "The sire owner has approved the use of {{sire_name}} for {{horse_name}}. Your application is proceeding.",
    },
    es: {
      subject: "Semental Aprobado — {{horse_name}}",
      body: "El propietario del semental ha aprobado el uso de {{sire_name}} para {{horse_name}}. Su solicitud continúa en proceso.",
    },
  },
  sire_denied: {
    en: {
      subject: "Sire Denied — {{horse_name}}",
      body: "The sire owner has denied the use of {{sire_name}} for {{horse_name}}. Please contact the registry for assistance.",
    },
    es: {
      subject: "Semental Rechazado — {{horse_name}}",
      body: "El propietario del semental ha rechazado el uso de {{sire_name}} para {{horse_name}}. Por favor contacte al registro para asistencia.",
    },
  },
  application_approved: {
    en: {
      subject: "Congratulations! {{horse_name}} Registered",
      body: "Your application for {{horse_name}} has been approved. Registration number: {{registration_number}}. Welcome to the registry!",
    },
    es: {
      subject: "¡Felicitaciones! {{horse_name}} Registrado",
      body: "Su solicitud para {{horse_name}} ha sido aprobada. Número de registro: {{registration_number}}. ¡Bienvenido al registro!",
    },
  },
  application_rejected: {
    en: {
      subject: "Application Not Approved — {{horse_name}}",
      body: "Your application for {{horse_name}} was not approved. Reason: {{reason}}. You may resubmit with corrections.",
    },
    es: {
      subject: "Solicitud No Aprobada — {{horse_name}}",
      body: "Su solicitud para {{horse_name}} no fue aprobada. Razón: {{reason}}. Puede volver a enviarla con correcciones.",
    },
  },
};

export function renderTemplate(
  type: NotificationType,
  lang: SupportedLanguage,
  vars: Record<string, string>,
): NotificationTemplate {
  const template = templates[type]?.[lang] ?? templates[type]?.en;
  if (!template) {
    return { subject: "Notification", body: "" };
  }

  function interpolate(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
  }

  return {
    subject: interpolate(template.subject),
    body: interpolate(template.body),
  };
}

export function getAvailableTypes(): NotificationType[] {
  return Object.keys(templates) as NotificationType[];
}
