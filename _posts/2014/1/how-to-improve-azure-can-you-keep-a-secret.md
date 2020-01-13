---
title: 'How to improve Azure:  Can you keep a secret?'
date: 2014-03-07 17:00:43 -08:00
permalink: /2014/03/07/how-to-improve-azure-can-you-keep-a-secret/
categories:
- Solution
tags:
- Security
---
<span style="font-family:Times New Roman;font-size:12pt;">In <a href="http://vincentlauzon.wordpress.com/2014/03/06/how-to-improve-azure/">this blog series</a> I explore some of the shortcomings of the Windows Azure platform (as of this date, March 2014) and discuss ways it could be improved. This isn't a rant against the platform: I've been using and promoting the platform for more than four (4) years now and I'm very passionate about it. Here I am pointing at problems and suggesting solutions. Feel free to jump in the discussion in the comments section!
</span>

<span style="font-family:Times New Roman;font-size:12pt;">What is a secret in the context of a Cloud Application?
</span>

<span style="font-family:Times New Roman;font-size:12pt;">A secret is any credentials giving access to something. Do I mean a password? Well, I mean a password, a username, an encryption key, a Share Access Signature (SAS), whatever gives access to resources.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">A typical Cloud application interacting with a few services accumulates a few of those. As an example:
</span>
<ul>
	<li><span style="font-family:Times New Roman;font-size:12pt;">User name / password to authenticate against the Azure Access Control Service (ACS) related to an Azure Service Bus (you access more than one Service Bus namespace? You'll have as many credentials as namespaces you are interacting with)
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">SAS to access a blob container
</span></li>
	<li>
<div style="text-align:justify;"><span style="font-family:Times New Roman;font-size:12pt;">Storage Account Access key to access a table in a Storage Account (yes <a href="http://blogs.msdn.com/b/windowsazurestorage/archive/2012/06/12/introducing-table-sas-shared-access-signature-queue-sas-and-update-to-blob-sas.aspx">you could do it with SAS now</a>, but I'm striking for diversity in this example ;) )
</span></div></li>
</ul>
<span style="font-family:Times New Roman;font-size:12pt;">All those secrets are used as input to some Azure SDK libraries during the runtime of the application. For instance, in order to create a <a href="http://msdn.microsoft.com/en-us/library/windowsazure/microsoft.servicebus.messaging.messagingfactory.aspx">MessagingFactory</a> for the Azure Service Bus, you'll need to call a <em>CreateAsync </em>method with the credentials of the account you wish to use.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">This means your application requires to <em>know</em> about the credentials: a weakness right there!
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Compare this with a typical way you configure an application on Windows Server. For instance, you want an IIS process to run under a given Service account? You asked your favorite sys-admin to punch in the Service Account name &amp; password into the IIS console at <em>configuration time</em> (i.e. not at runtime). The process will then run under that account and never the app will need to <em>know</em> the password.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">This might look like a convenience but it's actually a big deal. If your app is compromised in the Windows Server scenario, there is no way it can reveal the user credentials. In the case of your Azure app, well, it could reveal it. Once a malicious party has access to account credentials, it gives it more freedom to attack you than just having access to an app running under that account.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">But it doesn't stop there…
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Where do you store your secret on your Azure app? %99 of the time, in the <em>web.config</em>. That makes it especially easy for a malicious party to access your secrets.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Remember, an application deployed in Azure is accessible by <em>anyone</em>. The only thing protecting it is authentication. If you take an application living in your firewall and port it to the cloud, you just made it much more accessible (which is often an advantage because partners or even your employees, from an hotel room, have access to it without going through the hoops of VPN connections) but are also forced to store credentials in a less secure way!
</span>

<span style="font-family:Times New Roman;font-size:12pt;">On top of that, in terms of management, it's a bit awkward because it mixes application parameters with secrets. Once a developer deploys or creates a deployment package to pass it to the sys-admin (or whoever plays that role, it might be a dev-ops developer, but typically, not everyone in the dev group will know about production credentials), it must specifies some arbitrary config keys the sys-admin must override.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">So in summary, we have the following issues:
</span>
<ul>
	<li>Application knows secrets</li>
	<li>Secrets are stored in an unsecure way in the web.config</li>
	<li>Secrets are stored with other configuration parameters and do not have a standard naming (you need to come up with one)</li>
</ul>
<span style="font-family:Times New Roman;font-size:12pt;">Ok. How do we fix it?
</span>

<span style="font-family:Times New Roman;font-size:12pt;">This one isn't easy. Basically, my answer is: in the long run we could but cloud platforms haven't reached a mature enough level to implement that today. But we can establish a roadmap and get there one day with intermediary steps easing the pain along the way.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Basically, the current situation is:
</span>

<img src="/assets/posts/2014/1/how-to-improve-azure-can-you-keep-a-secret/030714_0258_howtoimprov1.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span>

<span style="font-family:Times New Roman;font-size:12pt;">That is, the app gets credentials from an unsecure secret store (typically <em>web.config</em>) then request an access token from an identity / token provider. It then uses that token to access resource. The credentials aren't used anymore.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">So a nice target solution would be:
</span>

<img src="/assets/posts/2014/1/how-to-improve-azure-can-you-keep-a-secret/030714_0258_howtoimprov2.png" alt="" /><span style="font-family:Times New Roman;font-size:12pt;">
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Here the application requests the token from Windows Azure (we'll discuss how) and Azure reads the secrets and fetch the token on behalf of the application. Here the application never knows about the secrets. If the application is compromised, it might still be able to get tokens, but not the credentials. This is a situation comparable to the Windows Server scenario we talked above.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Nice. Now how would that really work?
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Well, it would require a component in Azure, let's call it the <em>secret gateway</em>, to have the following characteristics:
</span>
<ul>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Have access to your secrets
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Knows how to fetch tokens using the secrets (credentials)
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">Have a way to authenticate the application so that only the application can access it
</span></li>
</ul>
<span style="font-family:Times New Roman;font-size:12pt;">That sounds like a job for an API. Here the danger is to design a .NET specific solution. Remember that Azure isn't only targeting .NET. It is able to host PHP, Ruby, Python, node.js, etc. . On the other hand, if we move it to something super accessible (e.g. Web Service), we'll have the same problem to authenticate the calls (i.e. requirement #3) than how we started.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">I do not aim at a final solution here so let's just say that the API would need to be accessible by any runtime. It could be a local web service for instance. The 'authentication' could then be a simple network rule. This isn't trivial in the case of a free Web Site where a single VM is shared (multi-tenant) between other customers. Well, I'm sure there's a way!
</span>

<span style="font-family:Times New Roman;font-size:12pt;">The first requirement is relatively easy. It would require Azure to define a vault and only the <em>secret gateway</em> to have access to it. No rocket science here, just basic encryption, maybe a certificate deployed with your application without your knowledge...
</span>

<span style="font-family:Times New Roman;font-size:12pt;">The second requirement is where the maturity of the cloud platform becomes a curse. Whatever you'll design today, e.g. oauth-2 authentication with SWT or JWT, is guaranteed to be obsolete within 2-3 years. The favorite token type seems to be changing every year (SAML, SWT, JWT, etc.), so is the authentication protocol (WS-Federation, OAuth, OAuth-2, XAuth, etc.).
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Nevertheless it could be done. It might be full of legacy stuff after 2 years, but it can keep evolving.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">I see the <em>secret gateway</em> being configured in two parts:
</span>
<ul>
	<li><span style="font-family:Times New Roman;font-size:12pt;">You specify a bunch of key / values (e.g. BUS_SVC_IDENTITY : "svc.my.identity")
</span></li>
	<li><span style="font-family:Times New Roman;font-size:12pt;">You specify token mechanism and their parameter (e.g. Azure Storage SAS using STORAGE_ACCOUNT &amp; STORAGE_ACCOUNT_ACCESS_KEY)
</span></li>
</ul>
<span style="font-family:Times New Roman;font-size:12pt;">You could even have a trivial mechanism simply providing you with a secret. The <em>secret gateway</em> would then act as a vault…
</span>

<span style="font-family:Times New Roman;font-size:12pt;">We could actually build it today as a separate service if it wasn't from the third requirement.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Do you think this solution would be able to fly? Do you think the problem is worth Microsoft putting resources behind it (for any solution)?
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Hope you enjoyed the ride!</span>