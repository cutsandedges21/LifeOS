// Legal document content for LifeOS, rendered by src/components/LegalPage.jsx.
//
// Each document is { title, lastUpdated, intro, sections }. A section is
// { heading, body }, where `body` is an array of items:
//   - a string          → a paragraph
//   - { list: [...] }    → a bulleted list
//
// These are written to reflect how the app ACTUALLY handles data (local-first
// storage, optional Supabase cloud sync, the Overseer AI calling a third-party
// model, opt-in browser notifications). They are professional templates, not
// legal advice — have a lawyer review before relying on them. Fill in the
// [Your jurisdiction] placeholder in the Terms before publishing.

const CONTACT_EMAIL = "lifeos.email@gmail.com";
const LAST_UPDATED = "June 3, 2026";

export const privacyPolicy = {
  id: "privacy",
  title: "Privacy Policy",
  lastUpdated: LAST_UPDATED,
  intro:
    "This Privacy Policy explains what information LifeOS (\"LifeOS\", \"we\", \"us\") collects, how it is used, and the choices you have. LifeOS is a personal productivity and self-tracking app operated by an independent developer. By using LifeOS you agree to the practices described here.",
  sections: [
    {
      heading: "1. Summary",
      body: [
        "LifeOS is built to be private by default. Your data lives on your device first, and is only sent to the cloud if you create an account to sync across devices. We do not sell your data, show ads, or use third-party advertising or analytics trackers.",
        "The two times your data leaves your device are: (1) optional cloud sync when you sign in, and (2) when you use the Overseer AI assistant, which sends the context needed to answer you to our server and an AI provider.",
      ],
    },
    {
      heading: "2. Information We Collect",
      body: [
        "Information you provide and create in the app:",
        {
          list: [
            "Account details — if you sign up, your email address and a password. Authentication is handled by Supabase; passwords are hashed by Supabase and are never visible to us in plain text.",
            "Your tracked data — the content you enter, such as goals, habits, gym splits and workout logs, sleep entries, finances (income, expenses, subscriptions, net worth), journal entries, history snapshots, and your in-app settings.",
            "Overseer messages — the chat messages you send to the Overseer AI assistant, along with a summary of your current context (for example streak, today's goals and habits, sleep, and recent journal lines) needed to generate a relevant reply.",
          ],
        },
        "Information collected automatically:",
        {
          list: [
            "Local app state stored in your browser's local storage on your device.",
            "Basic technical information inherent to any web request (such as your IP address and device/browser type) may be processed transiently by our hosting and infrastructure providers to deliver the service. We do not use this for tracking or profiling.",
          ],
        },
        "We do not knowingly collect precise location data, contacts, biometric identifiers, or advertising identifiers.",
      ],
    },
    {
      heading: "3. How We Use Information",
      body: [
        {
          list: [
            "To provide the app's core features and store your data on your device.",
            "To sync your data across your devices when you are signed in.",
            "To generate responses from the Overseer AI assistant when you choose to use it.",
            "To send opt-in browser notifications (such as the daily check-in and subscription-renewal reminders) if you enable them.",
            "To maintain, secure, debug, and improve the service.",
          ],
        },
        "We do not use your personal content to serve advertising, and we do not sell or rent your personal information.",
      ],
    },
    {
      heading: "4. Cloud Sync and Storage",
      body: [
        "If you do not create an account, your data stays in your browser's local storage on your device and is not transmitted to us.",
        "If you create an account and sign in, your tracked data and your account email are stored in our hosted database (Supabase) so they can sync across your devices. Data is transmitted over encrypted connections (HTTPS/TLS) and stored on Supabase's infrastructure. Clearing your browser storage removes the local copy but not the cloud copy; see Data Retention and Deletion below.",
      ],
    },
    {
      heading: "5. The Overseer AI Assistant",
      body: [
        "The Overseer is an optional AI coaching feature. When you send it a message, your message and a context summary of your current stats are sent to our server endpoint, which forwards them to a third-party AI model provider (Google's Gemini API) to generate a reply. The reply is returned to you and stored with your data.",
        "Do not send information to the Overseer that you would not want processed by a third-party AI provider. AI outputs may be inaccurate; see the Terms of Service for the applicable disclaimers.",
      ],
    },
    {
      heading: "6. Service Providers",
      body: [
        "We rely on a small number of third parties to operate LifeOS. They process data only to provide their services to us:",
        {
          list: [
            "Supabase — authentication and cloud database hosting for account and sync data.",
            "Google (Gemini API) — generating Overseer AI responses from the context you submit.",
            "Our application hosting/CDN provider — serving the app and routing the Overseer request.",
          ],
        },
        "Each provider processes data under its own terms and privacy practices.",
      ],
    },
    {
      heading: "7. Notifications",
      body: [
        "Browser notifications are off until you enable them and grant permission. They are generated locally by the app on your device. You can revoke permission at any time in your browser or device settings, and turn the feature off in LifeOS Settings.",
      ],
    },
    {
      heading: "8. Data Retention and Deletion",
      body: [
        "Local data persists on your device until you clear it. You can erase all local data at any time using \"Reset All Data\" in the Settings → Danger Zone.",
        "If you have an account, your synced data is retained until you delete it. To request deletion of your account and the data stored in our cloud, contact us at " +
          CONTACT_EMAIL +
          " and we will delete it within a reasonable period, except where retention is required by law.",
      ],
    },
    {
      heading: "9. Your Rights",
      body: [
        "Depending on where you live, you may have rights to access, correct, export, or delete your personal data, and to object to or restrict certain processing. Because most of your data is already in your hands on your device, you can exercise much of this directly in the app. For account/cloud data, contact us at " +
          CONTACT_EMAIL +
          " and we will respond consistent with applicable law (such as the GDPR or CCPA where they apply). We do not discriminate against you for exercising these rights.",
      ],
    },
    {
      heading: "10. Security",
      body: [
        "We use reasonable technical measures to protect your data, including encrypted transport and reputable infrastructure providers. No method of storage or transmission is perfectly secure, so we cannot guarantee absolute security. You are responsible for keeping your account credentials confidential.",
      ],
    },
    {
      heading: "11. Children's Privacy",
      body: [
        "LifeOS is not directed to children under 13 (or the minimum age required in your jurisdiction), and we do not knowingly collect data from them. If you believe a child has provided us personal data, contact us and we will delete it.",
      ],
    },
    {
      heading: "12. International Users",
      body: [
        "Our service providers may store and process data in countries other than your own. Where required, we rely on appropriate safeguards for such transfers. By using LifeOS, you understand your data may be processed in those locations.",
      ],
    },
    {
      heading: "13. Changes to This Policy",
      body: [
        "We may update this Policy from time to time. When we do, we will revise the \"Last updated\" date above. Material changes will be reflected in the app. Continued use after an update means you accept the revised Policy.",
      ],
    },
    {
      heading: "14. Contact Us",
      body: [
        "Questions or requests regarding this Policy or your data can be sent to " +
          CONTACT_EMAIL +
          ".",
      ],
    },
  ],
};

export const termsOfService = {
  id: "terms",
  title: "Terms of Service",
  lastUpdated: LAST_UPDATED,
  intro:
    "These Terms of Service (\"Terms\") govern your use of the LifeOS application (the \"Service\"), operated by an independent developer (\"LifeOS\", \"we\", \"us\"). By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
  sections: [
    {
      heading: "1. The Service",
      body: [
        "LifeOS is a personal productivity and self-tracking tool that helps you log and review goals, habits, workouts, sleep, finances, and journal entries, and includes an optional AI assistant called the Overseer. The Service is provided for your personal, non-commercial use.",
      ],
    },
    {
      heading: "2. Eligibility",
      body: [
        "You must be at least 13 years old (or the minimum age of digital consent in your jurisdiction) to use the Service. By using it, you represent that you meet this requirement and that the information you provide is accurate.",
      ],
    },
    {
      heading: "3. Your Account",
      body: [
        "An account is optional and only needed for cloud sync. You are responsible for safeguarding your login credentials and for all activity under your account. Notify us promptly at " +
          CONTACT_EMAIL +
          " if you suspect unauthorized use.",
      ],
    },
    {
      heading: "4. Your Data and Content",
      body: [
        "You own the data and content you create in LifeOS. You grant us a limited license to store, process, and transmit it solely to operate and provide the Service to you — for example, to sync it across your devices and to generate Overseer responses when you use that feature. We do not claim ownership of your content.",
      ],
    },
    {
      heading: "5. Acceptable Use",
      body: [
        "You agree not to:",
        {
          list: [
            "Use the Service for any unlawful purpose or in violation of these Terms.",
            "Attempt to disrupt, overload, reverse engineer, or gain unauthorized access to the Service or its infrastructure.",
            "Misuse the Overseer to generate unlawful, harmful, or abusive content.",
            "Infringe the rights of others or upload content you do not have the right to use.",
          ],
        },
      ],
    },
    {
      heading: "6. AI Features",
      body: [
        "The Overseer uses a third-party AI model to generate responses based on the context you submit. AI output can be inaccurate, incomplete, or inappropriate, and may not reflect your real situation. You are responsible for evaluating any output before relying on it. Do not submit information to the Overseer that you would not want processed by a third-party AI provider.",
      ],
    },
    {
      heading: "7. Not Professional Advice",
      body: [
        "LifeOS is a self-tracking tool, not a provider of professional advice. Nothing in the app — including Overseer messages and any fitness, sleep, financial, or wellbeing information — constitutes medical, mental-health, fitness, financial, legal, or other professional advice. Always consult a qualified professional before making decisions about your health, finances, or training. If you are in crisis or may be experiencing a medical emergency, contact your local emergency services.",
      ],
    },
    {
      heading: "8. Service Availability",
      body: [
        "We may modify, suspend, or discontinue any part of the Service at any time, including the Overseer and cloud sync, without liability. Features may change as the app evolves. We do not guarantee uninterrupted or error-free operation.",
      ],
    },
    {
      heading: "9. Disclaimer of Warranties",
      body: [
        "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR THAT YOUR DATA WILL ALWAYS BE PRESERVED. KEEP YOUR OWN BACKUPS OF ANYTHING IMPORTANT.",
      ],
    },
    {
      heading: "10. Limitation of Liability",
      body: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIFEOS AND ITS DEVELOPER WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID US FOR IT IN THE TWELVE MONTHS BEFORE THE CLAIM, WHICH FOR A FREE SERVICE IS ZERO.",
      ],
    },
    {
      heading: "11. Indemnification",
      body: [
        "You agree to indemnify and hold harmless LifeOS and its developer from any claims, damages, or expenses arising out of your misuse of the Service or your violation of these Terms or applicable law.",
      ],
    },
    {
      heading: "12. Termination",
      body: [
        "You may stop using the Service at any time and delete your data via Settings or by contacting us. We may suspend or terminate access if you violate these Terms or to protect the Service. Provisions that by their nature should survive termination (such as disclaimers and limitations of liability) will survive.",
      ],
    },
    {
      heading: "13. Changes to These Terms",
      body: [
        "We may update these Terms from time to time. We will revise the \"Last updated\" date above and reflect material changes in the app. Continued use after changes take effect constitutes acceptance of the updated Terms.",
      ],
    },
    {
      heading: "14. Governing Law",
      body: [
        "These Terms are governed by the laws of [Your jurisdiction], without regard to its conflict-of-laws rules. You agree to the exclusive jurisdiction of the courts located there for any dispute not subject to binding arbitration or small-claims resolution, to the extent permitted by law.",
      ],
    },
    {
      heading: "15. Contact Us",
      body: [
        "Questions about these Terms can be sent to " + CONTACT_EMAIL + ".",
      ],
    },
  ],
};

export const legalDocs = { privacy: privacyPolicy, terms: termsOfService };
