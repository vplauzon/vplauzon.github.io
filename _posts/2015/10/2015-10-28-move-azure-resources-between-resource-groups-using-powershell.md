---
title: Move Azure Resources between Resource Groups using Powershell
date: 2015-10-28 19:00:50 -04:00
permalink: /2015/10/28/move-azure-resources-between-resource-groups-using-powershell/
categories:
- Solution
tags:
- PowerShell
---
Ouf...  I've been using Azure for quite a while in the old (current actually) portal.  Now I look into my resources in the new (preview) portal and...  what a mess of a resource group mosaic!

Unfortunately, at the time of this writing, you can't move resources from a Resource Group to another via the portal...

&nbsp;

If you've been there, hang on, I have the remedy and it involves Powershell!

I'll assume you've installed the latest Azure PowerShell cmdlets.  Fire up Powershell ISE or your favorite interface.

First things first, don't forget to tell Powershell to switch to Resource Manager SDK:

<em>Switch-AzureMode AzureResourceManager</em>

Then, you'll need to know the resource ID of your resources.  You can use the cmdlet <em>Get-AzureResource</em>.

In my case, I want to move everything related to an app named "Readings" into a new resource group I've created (in the portal).  So I can grab all those resources:

<em>Get-AzureResource | Where-Object {$_.Name.Contains("eading")}</em>

Then I can move my resources:

<em>Get-AzureResource | Where-Object {$_.Name.Contains("eading")} `</em>
<em> | foreach {Move-AzureResource -DestinationResourceGroupName "Reading" -ResourceId $_.ResourceId -Force}</em>

Unfortunately, not every resource will accept to be moved like this.  I had issues with both Insights objects and Job Collection (Scheduler).  The latter is managed only in the old (current) portal, so I would think it isn't under the Azure Resource Manager yet.  For Insight, a similar story probably applies.