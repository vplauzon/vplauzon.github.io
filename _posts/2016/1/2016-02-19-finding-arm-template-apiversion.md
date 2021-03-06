---
title: Finding ARM template ApiVersion
date: 2016-02-19 04:00:23 -08:00
permalink: /2016/02/19/finding-arm-template-apiversion/
categories:
- Solution
tags:
- PowerShell
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="https://openclipart.org/image/300px/svg_to_png/191890/powershell2.png" alt="" align="right" border="0" />Writing an Azure ARM template for a Resource Group is getting easier every day but it remains a sport for the initiated.

Here I want to give a tip about something I often find hard:  how to get the API version of a resource in an ARM template?

As everything hardcore in the platform, we’ll use PowerShell!

The example I’ll use today is creating a backup vault using ARM.
<h2>Login</h2>
As usual, please do login in PowerShell <em>Integrated Scripting Environment</em> (ISE) with the usual command <em>Login-AzureRmAccount</em>.
<h2>Find your provider</h2>
First you need to find the provider for the resource you want to create.

For that, use <em>Get-AzureRmResourceProvider</em>.  This will return the list of all available providers.

<a href="/assets/posts/2016/1/finding-arm-template-apiversion/image9.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/finding-arm-template-apiversion/image_thumb9.png" alt="image" width="1509" height="143" border="0" /></a>

For me, since I’m looking for the backup vault, the <em>Microsoft.Backup</em> provider seems promissing.

The following will give you all the resource types under the provider (in this case only one):

```PowerShell
(Get-AzureRmResourceProvider -ProviderNamespace "Microsoft.Backup").ResourceTypes
```

<a href="/assets/posts/2016/1/finding-arm-template-apiversion/image10.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/finding-arm-template-apiversion/image_thumb10.png" alt="image" width="1151" height="73" border="0" /></a>

You see already that we get very valuable information here.  We get the API versions I was looking for but also the Azure regions where the resources are available.
<h2>ARM Template</h2>
Once you know the Api Version it is much easier to create the arm template.  In the case of my backup vault:

```javascript
{
      "name": "AdvVault-cp",
      "type": "Microsoft.Backup/BackupVault",
      "apiVersion": "2015-03-15",
      "location": "[resourceGroup().location]",
      "tags": { },
      "properties": {
        "sku": {
          "name": "[parameters('skuName')]"
        }
      }
}
```

<h2>Conclusion</h2>
There really is a wealth of information you can undig by using just a few Azure PowerShell cmdlets.

One of the tricky part when you reverse engineer an ARM template starting from the <em>Resource Explorer</em> in the portal is to find the API version which you can get with a few cmd lets as demonstrated here.