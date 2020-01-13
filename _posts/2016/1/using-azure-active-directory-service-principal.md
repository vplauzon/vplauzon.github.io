---
title: Using Azure Active Directory Service Principal
date: 2016-02-04 13:40:41 -08:00
permalink: /2016/02/04/using-azure-active-directory-service-principal/
categories:
- Solution
tags:
- Identity
---
You need an Azure Active Directory (AAD) identity to run some of your services:  perhaps an Azure Runbook, Azure SQL Database, etc.  .

You could create a normal user in Azure Active Directory and use it.  If your AAD is synchronized with an on-premise one, it will get more complicated though.  You will need to create it on premise and wait for it to synchronize.  What if you organization activated double-factor authentication on the accounts?  Well, you can’t use the account for automation then because you won’t be able to just pass the credential in PowerShell.
<h2>Service Principal</h2>
The solution then is to use a <em>Service Principal</em>.  Concretely, that’s an AAD <em>Application</em> with delegation rights.  You can then use it to authenticate.

You can even give it RBAC permissions in Azure Resource Model, e.g. make it a contributor on your resource group.

Applications aren’t subjected to the same constrains as users.  For instance, they aren’t synchronized with On-Premise AD so you can go ahead and create them in any AAD.
<h2>Creating the Service Principal</h2>
Here I will refer you to the excellent article of Tom FitzMacken:  <a href="https://azure.microsoft.com/en-us/documentation/articles/resource-group-create-service-principal-portal/" target="_blank">Create Active Directory application and service principal using portal</a>.

The author walks you step by step on how to create &amp; configure the AAD application.

Once you have it, you can use it by using the Application’s <em>Client ID</em> as the <em>User Name</em> and its <em>key</em> as the <em>password</em>.
<h2>Give rights to the Service Principal</h2>
You give rights to the service principal the same way you would for a normal user.

That is, from any resource or resource group in the portal, click the “Access” icon.

<a href="/assets/posts/2016/1/using-azure-active-directory-service-principal/image.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/using-azure-active-directory-service-principal/image_thumb.png" alt="image" width="278" height="82" border="0" /></a>

From there, click the <em>Add</em>  button.

Then first select a role (e.g. <em>Contributor</em>), then select the user.  You can use the Service Principal name here instead of its <em>Client ID</em>.

The role you selected determines the access.  You’ll typically want to give the least access possible (following the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege" target="_blank">Principle of Least Privilege</a>).
<h2>Using it in PowerShell</h2>
A key scenario is to use the Service Principal to authenticate in PowerShell in order to perform automation.  This could be from within an Azure Runbook, a PowerShell script or even a console.

You need to jump through some hoops in order to do that as the Azure PowerShell SDK requires secured string for the password.

First, create a secured string for your password:

$secPassword = ConvertTo-SecureString "<em>My PASSWORD</em>" -AsPlainText –Force

Then create the credentials:

$credential = New-Object System.Management.Automation.PSCredential("<em>My Client ID</em>", $secPassword)

And finally login to the Azure PowerShell SDK:

Add-AzureRmAccount -Credential $credential -ServicePrincipal -Tenant "<em>My Tenant ID</em>"

Here it is important you specify the tenant ID as the Guid and not the name.

Following this you can use the Azure PowerShell SDK to do whatever the Service Principal can do.
<h2>Conclusion</h2>
I hope this looks simple enough.  There are a lot of catches along the way where the SDK will give you an error.

This showed you how to create a service principal to then use it to perform some action in Azure.

You could create multiple Service Principal for different types of action.  You could for instance create one to automate storage cleanup, another one to update VMs, etc.  .  You would then give different roles to each one.

Service Principal, i.e. AAD applications, have keys.  They can have more than one at the same time so you can roll them over in maintenance.