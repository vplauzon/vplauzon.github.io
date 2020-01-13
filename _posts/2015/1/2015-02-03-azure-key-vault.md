---
title: Azure Key Vault
date: 2015-02-03 19:13:54 -08:00
permalink: /2015/02/03/azure-key-vault/
categories:
- Solution
tags:
- API
- Integration
- Security
---
Has somebody been peeking on my <a href="http://vincentlauzon.com/2014/03/07/how-to-improve-azure-can-you-keep-a-secret/">X-mas list</a>?

Indeed, one of the weakness of the current Azure Paas solution I pointed out last year was that on non-trivial solutions you end up with plenty of secrets (e.g. user-name / password, SAS, account keys, etc.) stored insecurely in your web.config (or similar store).

I was suggesting, as a solution, to create a Secret Gateway between your application and a secret vault.

<a href="http://azure.microsoft.com/en-us/documentation/articles/key-vault-whatis/"><img src="/assets/posts/2015/1/azure-key-vault/020415_0333_azurekeyvau1.jpg" alt="" align="left" border="0" /></a>Essentially, <a href="http://azure.microsoft.com/en-us/documentation/articles/key-vault-whatis/">Azure Key Vault</a> fulfils the <em>secret vault</em> part and a part of the <em>Secret Gateway</em> too.

Azure Key Vault, a new Azure Service currently (as of early February 2015) in Preview mode, allows you to store keys and other secret in a vault.

One of the interesting feature of Azure Key Vault is that, as a consumer, you authenticate as an Azure Active Directory (AAD) application to access the vault and are given authorization as the application. You can therefore easily foresee scenarios where the only secret stored in your configuration is your AAD application credentials.

The vault also allows you to perform some cryptographic operation on your behalf, e.g. encrypting data using a key stored in the vault. This enables scenarios where the consuming application never knows about the encrypting keys. This is why I say that Azure Key Vault performs some functions I described for the <em>Secret Gateway</em>.

<img src="/assets/posts/2015/1/azure-key-vault/020415_0333_azurekeyvau2.jpg" alt="" align="right" />I see many advantages of using Azure Key Vault. Here are the ones that come on the top of my head:
<ul>
	<li>Limit the amount of secrets stored in your application configuration file</li>
	<li>Centralize the management of secrets: a key is compromised and you want to change it, no more need to chase the config files storing it, simply change it in one place in the vault.</li>
	<li>Put secrets at the right place: what is unique to your application? Your application itself, i.e. AAD application credentials. That is in your app config file, everything else is in the vault.</li>
	<li>Audit secret access</li>
	<li>Easy to revoke access to secrets</li>
	<li>Etc.</li>
</ul>
I think to be air tight, the <em>Secret Gateway</em> would still be interesting, i.e. an agent that authenticates on your behalf and return you a token only. This way if your application is compromised, only temporary tokens are leaked, not the master keys.

But with Azure Key Vault, even if you do not have a <em>Secret Gateway</em>, if you compromise your master keys you can centrally rotate them (i.e. change them) without touching <em>N</em> applications.

I'm looking forward to see where this service is going to grow and certainly will consider it in future Paas Architecture.