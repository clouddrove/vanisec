---
name: share-credential
description: Hand a credential to someone as a Vanisec one-time link, without the value entering the conversation
agent: agent
argument-hint: what the credential is for, and who receives it
---

Share a credential using Vanisec, for the purpose and recipient given in the chat input.

Work through this in order.

1. Establish whether the credential already exists. If it has not been issued
   yet, it does not exist, and you should generate it.
2. If it does not exist, call `vanisec_generate_secret`. Pick `type` from the
   use: `password` for a login, `token` for an API key or bearer token, `hex`
   for a signing or encryption key. Leave `length` alone unless the receiving
   system enforces a limit. Set `expiresIn` to 1 if the recipient is waiting,
   otherwise leave the default of 24.
3. If it already exists and the user has it in hand, call
   `vanisec_create_secret` with their value and a password they choose. Do not
   invent the value yourself, and do not invent the password. Say plainly that
   both are now in the transcript.
4. Report back with the link, who it is for, and when it expires. Never repeat
   the credential itself.
5. Remind the user to send the link password through a different channel from
   the link, and to tell the recipient that the link opens once and is then
   destroyed.

Do not offer to read the secret back. No such tool exists, by design.
