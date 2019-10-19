---
title: Azure Key Vault – Step by Step
date: 2015-06-13 16:45:53 -04:00
permalink: /2015/06/13/azure-key-vault-step-by-step/
categories:
- Solution
tags:
- Security
---
<a href="http://vincentlauzon.com/2015/02/03/azure-key-vault/">Azure Key Vault</a> is an Azure packaged service allowing you to encrypt keys and small secrets (e.g. passwords, SAS) and manage them in a secure fashion.  Azure Key Vault actually allows you to store cryptographic keys and do operations with them (e.g. encrypt data) without revealing the key, which is pretty cool.  <a href="http://azure.microsoft.com/en-us/services/key-vault/">Check it out</a>.

A typical problem with those new services is the lack of documentation.  Well, no more for the Key Vault, thanks to <a href="https://social.technet.microsoft.com/profile/Dan%20Plastina%20[MSFT]" target="_blank">Dan Plastina</a> <a href="http://blogs.technet.com/b/kv/archive/2015/06/02/azure-key-vault-step-by-step.aspx" target="_blank">step by step guide</a> on Key vault.  It's succinct, straight to the point and well written.

The guide's backbone is the vault's lifecycle:

<a href="/assets/2015/6/azure-key-vault-step-by-step/8875-keyvaultlifecycle31.png"><img class="aligncenter wp-image-788 size-full" src="/assets/2015/6/azure-key-vault-step-by-step/8875-keyvaultlifecycle31.png" alt="8875.KeyVaultLifecycle3[1]" width="756" height="563" /></a>Now this basically allows you to go to town with the vault.  It's a very clean workflow that enables many scenarios.

The typical ones I would see are:
<ul>
	<li>Secret owner creates a bunch of secrets for SAS (e.g. storage accounts, Service Bus) and allows some applications to have access to them</li>
	<li>Application access those secrets via REST API</li>
	<li>Those secrets are refreshed directly in the vault by the secret owner</li>
	<li>Secrets can be refreshed on Schedule by a web job
<ul>
	<li>e.g. using a storage account key, itself another secret refreshed manually (or by another process), the web job recreates SAS valid for 40 days every 30 days</li>
</ul>
</li>
	<li>Auditor can check that access is conform to establish design</li>
</ul>
This is so much cleaner than what I see today in the field where SAS are created, put in web.config, forgotten there until they expire and shared between developers who troubleshoot problems in production, etc.  .  Because of the work involved trying to cycle the SAS, those SAS are usually created with multi-years validity, so if they get compromised, well, you get the picture.

The nice thing here is that the vault is doing more than protecting secrets:  <strong>it allows you to manage them centrally</strong>.  For me that is half the value.  Especially if you have an application park bigger than 2 apps sharing some secrets.  It gives you a visibility of which secrets are used by whom and allows you to manage them.  You do not need to have SAS that last for 5 years anymore since you can cycle them centrally.