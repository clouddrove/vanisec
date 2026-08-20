---
name: vanisec-rotate-credential
description: Use when a credential has to be replaced and the new one handed to someone. Covers rotating an AWS access key, a database password, an API token, a service account key, a webhook signing secret or a CI variable, including after a suspected leak or when someone leaves the team. Gives the ordering that avoids an outage (share the new one and confirm receipt before revoking the old one) and keeps the new value out of the conversation transcript by generating it with the Vanisec MCP server.
license: MIT
---

# Rotating a credential and handing over the new one

Rotation is two jobs at once: replacing a credential, and getting the
replacement to whoever needs it. Doing them in the wrong order causes an outage.
Doing the handover carelessly leaves the new credential in a chat log, which
defeats the point of rotating.

The `vanisec-share-secret` skill covers the two Vanisec tools and how to choose
between them. This skill is about the sequence.

## The order, and it is not negotiable

1. **Create the new credential.** Prefer `vanisec_generate_secret`, so the new
   value never enters this conversation. Use `vanisec_create_secret` only when
   the value has to be issued by the system that owns it (an AWS access key, a
   token minted by a provider console or CLI) and it is therefore already in
   hand.
2. **Send the link and the password through different channels.** Together they
   grant access, so splitting them is what makes the handover safe.
3. **Wait for the recipient to confirm they have the new credential and that it
   works.** The link opens once and is then destroyed. If it expired, or the
   wrong person opened it, go back to step 1 and issue another credential.
   Confirmation has to come from the recipient; there is no retrieval tool and
   no way to check from here whether a link was opened.
4. **Only then revoke or delete the old credential.**

**Revoking first is the failure worth avoiding.** The moment the old credential
is gone, everything still using it breaks: running services, cron jobs, CI
pipelines, other people's local setups. If anything then goes wrong in steps 2
or 3, nobody has a working credential at all, and the fastest way out is
usually somebody pasting a secret into a chat window.

The exception is an active compromise. If the credential is known to be in the
wrong hands, revoke immediately and accept the outage. Say so explicitly when
you make that call, so the user knows the breakage is deliberate.

## Before step 4, list what else holds the old value

A credential is rarely used in one place. Ask for or work out the full list and
give it to the user before anything is revoked:

- configuration files and environment files on servers and laptops
- CI and CD variables, and repository or organisation level secrets
- secret managers and parameter stores
- running services that read the value at startup and need a restart
- container images or manifests that carry it
- scheduled jobs, monitoring integrations, third party webhooks

Anything on that list that is not updated will break at step 4 rather than at
step 1, which is why the list has to exist before the revoke.

## Generating the replacement

Reach for `vanisec_generate_secret` whenever the new value is something you are
free to choose:

- database and service passwords, `type: "password"`
- API tokens and bearer tokens, `type: "token"`
- signing keys, encryption keys and webhook secrets, `type: "hex"`

Defaults are 24 characters for `password`, 32 for `token` and 64 for `hex`. Only
override `length` when the receiving system enforces its own limit, and never
downward for convenience. Set `expiresIn` short (1 or 6 hours) when the
recipient is waiting, since a rotation handover is usually time boxed anyway.

The tool puts the link password on the system clipboard and returns only the
URL. If it reports that no clipboard is available, do not fall back to pasting
the credential into the conversation. See the share skill for the options.

## When the provider issues the value

Some credentials cannot be generated locally. A cloud access key, an OAuth
client secret, a managed database password reset by the provider: in each case
the provider hands you the value, and it exists before Vanisec is involved.

Run the provider's own command or console flow, then pass the result to
`vanisec_create_secret`. Be honest about the cost: the value is in the
transcript from the moment it is passed in. Keep it out of intermediate steps
where you can, for example by having the user capture the output themselves
rather than printing it into the conversation.

Typical shapes of the commands involved, as illustration only. Check the
provider's current documentation rather than copying these:

- Cloud access keys: create a new key for the identity, verify it, then delete
  the old key by its identifier.
- Managed databases: modify the instance or role with a new password, then
  restart or reload whatever pools connections.
- Git hosting and SaaS APIs: mint a new token with the same scopes, replace it
  everywhere, then revoke the previous one from the tokens page.

Never write out a value that looks like a real credential, in a command, in an
example or in a summary. Refer to it by name.

## Closing out

Once the old credential is revoked, confirm two things and say them plainly:

- the old value no longer authenticates anywhere
- every consumer from the list above is on the new value

If the rotation was triggered by a leak, also note where the old value was
exposed, so the same channel is not used for the handover.
