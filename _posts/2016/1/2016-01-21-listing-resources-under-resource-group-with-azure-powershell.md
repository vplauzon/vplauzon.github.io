---
title: Listing Resources under Resource Group with Azure PowerShell
date: 2016-01-21 19:14:43 -08:00
permalink: /2016/01/21/listing-resources-under-resource-group-with-azure-powershell/
categories:
- Solution
tags:
- PowerShell
---
Simple task:  I want to list resources under a single ResourceGroup within one of the subscription.

This is an excuse to show how to login on different subscription and play a bit with the PowerShell Azure SDK.

First thing, start PowerShell Integrated Script Environment (ISE) with the Azure SDK loaded.
<h2>Login</h2>
Login to your accounts…

```powershell
Login-AzureRmAccount
```

This will prompt you to enter an ID + credentials.  Once you enter them, you should be in your subscription.

…  if you have more than one subscription?  Ok, that’s a little more complicated.

You need to find the subscription ID you are interested in.  Either go to <a title="https://account.windowsazure.com/Subscriptions" href="https://account.windowsazure.com/Subscriptions">https://account.windowsazure.com/Subscriptions</a> to find it in the UI or…  use more PowerShell scripts:

```powershell
Get-AzureRmSubscription
```

Once you have your subscription ID, simply grab the ID and pass it to:

```powershell
Add-AzureRmAccount –SubscriptionId <your subscription ID here>
```

This should prompt you again and afterwards, you’ll be in the context of the right subscription.
<h2>List resources under resource group</h2>
Now that you’re within the right subscription, let’s list the resource groups within that subscription:

```powershell
Get-AzureRmResourceGroup
```

This will give you the list of resources under that resource group.  Grab the resource group name and then you can list the resources underneath:

```powershell
$res = Get-AzureRmResource | Where–Object {$_.ResourceGroupName –eq <You resource group name>}
```

<h2>Conclusion</h2>
That’s it!  I just wanted to get this ceremony out of the way.

You can build on that and use all different kind of cmdlets to query and manipulate your subscriptions.