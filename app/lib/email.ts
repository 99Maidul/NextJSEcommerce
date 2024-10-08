import { link } from "fs";
import { MailtrapClient } from "mailtrap";
import nodemailer from "nodemailer";

type profile = { name: string; email: string };

const TOKEN = process.env.MAILTRAP_TOKEN!;
const ENDPOINT = process.env.MAILTRAP_ENDPOINT!;

const client = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });

const sender = {
  email: "verification@myjavaproject.org",
  name: "Next Ecom Verification",
};

interface EmailOptions {
  profile: profile;
  subject: "verification" | "forget-password" | "password-changed";
  linkUrl?: string;
}

const generateMailTransporter = () => {
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "a84eff184a5ce2",
      pass: "ead965c086a4b9"
    }
  });
  return transport;
};

const sendEmailVerificationLink = async (profile: profile, linkUrl: string) => {
  // const transport = generateMailTransporter();
  // await transport.sendMail({
  //   from: "verification@nextecom.com",
  //   to: profile.email,
  //   html: `<h1>Please verify your email by clicking on <a href="${linkUrl}">this link</a> </h1>`,
  // });

  const recipients = [
    {
      email: profile.email,
    },
  ];

  await client.send({
    from: sender,
    to: recipients,
    template_uuid: "8065939c-7d02-416c-a758-fbdd33cb0ecb",
    template_variables: {
      subject: "Verify Email",
      user_name: profile.name,
      company_name: "NextJS Ecomm",
      btn_title:"Click to verify Email",
      link:linkUrl
    },
  });
};

const sendForgetPasswordLink = async (profile: profile, linkUrl: string) => {
  // const transport = generateMailTransporter();

  // await transport.sendMail({
  //   from: "verification@nextecom.com",
  //   to: profile.email,
  //   html: `<h1>Click on <a href="${linkUrl}">this link</a> to reset your password.</h1>`,
  // });

  const recipients = [
    {
      email: profile.email,
    },
  ];

  await client.send({
    from: sender,
    to: recipients,
    template_uuid: "8065939c-7d02-416c-a758-fbdd33cb0ecb",
    template_variables: {
      subject: "Password Reset Successful",
      user_name: profile.name,
       company_name: "NextJS Ecomm",
       btn_title:"Sign In",
       link: process.env.SIGN_IN_URL!
    },
  });
};

const sendUpdatePasswordConfirmation = async (profile: profile) => {
  // const transport = generateMailTransporter();

  // await transport.sendMail({
  //   from: "verification@nextecom.com",
  //   to: profile.email,
  //   html: `<h1>We changed your password <a href="${process.env.SIGN_IN_URL}">click here</a> to sign in.</h1>`,
  // });

  const recipients = [
    {
      email: profile.email,
    },
  ];

  await client.send({
    from: sender,
    to: recipients,
    template_uuid: "eba72c1b-18b1-465d-af1a-913fad2fd2f6",
    template_variables: {
      subject: "Password Reset Successful",
      user_name: profile.name,
      link: process.env.SIGN_IN_URL!,
      btn_title: "Sign in",
      company_name: "Next Ecom",
    },
  });
};

export const sendEmail = (options: EmailOptions) => {
  const { profile, subject, linkUrl } = options;

  switch (subject) {
    case "verification":
      return sendEmailVerificationLink(profile, linkUrl!);
    case "forget-password":
      return sendForgetPasswordLink(profile, linkUrl!);
    case "password-changed":
      return sendUpdatePasswordConfirmation(profile);
  }
};
