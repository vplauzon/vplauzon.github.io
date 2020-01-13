---
title: Azure Key Vault - Pricing
date: 2015-06-20 09:00:30 -07:00
permalink: /2015/06/20/azure-key-vault-pricing/
categories:
- Solution
tags:
- Security
---
<a href="http://vincentlauzon.com/2015/06/13/azure-key-vault-step-by-step/">Azure Key Vault</a> is an Azure packaged service allowing you to encrypt keys and small secrets (e.g. passwords, SAS) and manage them in a secure fashion.  Azure Key Vault actually allows you to store cryptographic keys and do operations with them (e.g. encrypt data) without revealing the key, which is pretty cool.  <a href="http://azure.microsoft.com/en-us/services/key-vault/">Check it out</a>.

Now a common question when new services come along is:  how much does it cost?  We all remember looking at the API management and saying:  I'm gona put that in front of all my APIs until we reached the price tag and back-paddled!

With Key Vault, things are pretty cheap.  Let's look at <a href="http://azure.microsoft.com/en-us/pricing/details/key-vault/" target="_blank">the pricing</a>.

Unless you go HSM protection (in which case you probably work for a Financial institution, in which case the pricing likely isn't going to be the show stopper), Azure charges you by operation:

$0.0159 / 10 000 operations

Well, that's pretty cheap unless...  you implement access to the vault just before the implementation of every secret usage.  Say you have an app that generates a temporary SAS for each image it displays and you access the vault to get your hand on the Storage Account Primary key every single time, well...  if your site is busy, you're gona end up paying for those operation.

But if you do that, you're gona slow down your site anyway since you REST API over HTTPS at every image you want to display, a bad idea in the first place.

My recommandation:  cache the recovered secrets for a short duration of time, say 5 minutes.  This way you won't be penalized in term of performance nor in pricing.