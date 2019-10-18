---
title:  Shutting down VMs on schedule in Azure
date:  2016-02-05 11:28:18 +00:00
permalink:  "/2016/02/05/shutting-down-vms-on-schedule-in-azure/"
categories:
- Solution
tags:
- Automation
---
I thought it was time for a post on the quintessential automation task:  shutting down VMs &amp; starting them on a schedule.

UPDATE (Nov-27th 2016):  this particular task is <a href="https://azure.microsoft.com/en-us/blog/announcing-auto-shutdown-for-vms-using-azure-resource-manager/">now available directly in the VM portal </a>(at least the shut down part of it).  This article remains interesting to look at a complete example of Azure Automation.

This is a perfect job for Azure Automation / Runbook and will allow us to discover plenty of details.

I took some inspiration from <a href="https://automys.com/library/asset/scheduled-virtual-machine-shutdown-startup-microsoft-azure" target="_blank">Noah Stahl on automys.com</a>.  His approach was quite original as he uses the Azure Tags to input a schedule for a VM to be up / down.

I kept the tag idea but left the scheduling to Azure Automation as it does it much better and more robustly.
<h2>Functional</h2>
So the way this is gona work is that we’re going to have a runbook running a PowerShell workflow.  This script will scan your entire subscription for VMs with a specified tag on them.  For those, it will shut them down.

A similar runbook will start-up those VMs.
<h2>Azure Automation</h2>
Please see <a href="https://vincentlauzon.com/2015/11/01/azure-runbook-a-complete-simple-example/">Azure Runbook – A complete (simple) example</a> in order to create an Automation account.
<h2>Credentials</h2>
Once created, we should create a credential with a Service Principal.  Please read through <a href="https://vincentlauzon.com/2016/02/04/using-azure-active-directory-service-principal/">Using Azure Active Directory Service Principal</a> in order to create a Service Principal.

<a href="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image_thumb1.png" alt="image" width="334" height="334" border="0" /></a>

Click <em>Add a credential</em>.

<a href="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image_thumb2.png" alt="image" width="527" height="1070" border="0" /></a>

And fill the fields the following way:
<ul>
 	<li>Name:  <em>principal</em></li>
 	<li>Description:  something like “Principal used to start / shutdown VMs”</li>
 	<li>User Name:  the <em>Client ID</em> of the AAD Application (Service Principal)</li>
 	<li>Password:  the key of the AAD Application</li>
</ul>
Then we’re going to give some access to this principal so it can see VMs and start / shut them down.

The easiest way is to go in a Resource Group containing a VM and adding access.

<a href="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/2/shutting-down-vms-on-schedule-in-azure/image_thumb3.png" alt="image" width="306" height="82" border="0" /></a>

Add a user, give it the <em>Virtual Machine Contributor</em> role and type the name of the AAD application for user name.
<h2>Shutdown Runbook</h2>
At the center of this runbook is the <a href="https://msdn.microsoft.com/en-us/library/mt603483.aspx" target="_blank">Stop-AzureRmVm</a> cmdlet.

[code language="powershell"]
workflow Shutdown-VMs
{
	Param
    (
        [parameter(Mandatory=$true)]
        [String] $tagKey=&quot;env&quot;,
        [parameter(Mandatory=$true)]
        [String] $tagValue=&quot;dev&quot;
    )

	#	Refered to the credential stored in the Azure Automation account
	$credentialAssetName = &quot;principal&quot;
	$cred = Get-AutomationPSCredential -Name $credentialAssetName
	
    if(!$cred)
	{
        Throw &quot;Could not find an Automation Credential Asset named '${credentialAssetName}'. Make sure you have created one in this Automation Account.&quot;
    }

    #	Connect to your Azure subscription
    $account = Add-AzureRmAccount -ServicePrincipal -Credential $cred -Tenant &quot;72f988bf-86f1-41af-91ab-2d7cd011db47&quot;
    if(!$account)
	{
        Throw &quot;Could not authenticate to Azure using the credential asset '${credentialAssetName}'. Make sure the user name and password are correct.&quot;
    }

	#	Get all the VMs in the subscription (the ones the principal is able to see)
	#	Filter on the ones having the tag specified in the runbook parameter
	$vms = Get-AzureRmVM | Where-Object {$_.Tags[$tagKey] -eq $tagValue}

	#	Shutdown-VMs in parallel	
	ForEach -Parallel ($v in $vms)
	{
		Write-Output &quot;Stopping $($v.ResourceGroupName).$($v.Name)&quot;
		$ops = Stop-AzureRmVM -ResourceGroupName $v.ResourceGroupName -Name $v.Name -Force
		
		if($ops.IsSuccessStatusCode -ine $true)
		{
			Write-Output &quot;Failure to stop $($v.ResourceGroupName).$($v.Name)&quot;
		}
		else
		{
			Write-Output &quot;$($v.ResourceGroupName).$($v.Name) Stopped&quot;
		}
	}	
}
[/code]

You can save, test and publish the runbook.
<h2>Start Runbook</h2>
At the center of this other runbook is the <a href="https://msdn.microsoft.com/en-us/library/mt603453.aspx" target="_blank">Start-AzureRmVm</a> cmdlet.  It is basically identical to the other one except for this cmdlet.

[code language="PowerShell"]
workflow Start-VMs
{
	Param
    (
        [parameter(Mandatory=$true)]
        [String] $tagKey=&quot;env&quot;,
        [parameter(Mandatory=$true)]
        [String] $tagValue=&quot;dev&quot;
    )

	#	Refered to the credential stored in the Azure Automation account
	$credentialAssetName = &quot;principal&quot;
	$cred = Get-AutomationPSCredential -Name $credentialAssetName
	
    if(!$cred)
	{
        Throw &quot;Could not find an Automation Credential Asset named '${credentialAssetName}'. Make sure you have created one in this Automation Account.&quot;
    }

    #	Connect to your Azure subscription
    $account = Add-AzureRmAccount -ServicePrincipal -Credential $cred -Tenant &quot;72f988bf-86f1-41af-91ab-2d7cd011db47&quot;
    if(!$account)
	{
        Throw &quot;Could not authenticate to Azure using the credential asset '${credentialAssetName}'. Make sure the user name and password are correct.&quot;
    }

	#	Get all the VMs in the subscription (the ones the principal is able to see)
	#	Filter on the ones having the tag specified in the runbook parameter
	$vms = Get-AzureRmVM | Where-Object {$_.Tags[$tagKey] -eq $tagValue}

	#	Start-VMs in parallel	
	ForEach -Parallel ($v in $vms)
	{
		Write-Output &quot;Starting $($v.ResourceGroupName).$($v.Name)&quot;
		$ops = Start-AzureRmVM -ResourceGroupName $v.ResourceGroupName -Name $v.Name
		
		if($ops.IsSuccessStatusCode -ine $true)
		{
			Write-Output &quot;Failure to start $($v.ResourceGroupName).$($v.Name)&quot;
			Write-Output $ops
		}
		else
		{
			Write-Output &quot;$($v.ResourceGroupName).$($v.Name) Started&quot;
		}
	}	
}
[/code]

<h2>Scheduling</h2>
Now that we have both runbooks we can give them a schedule by creating a job for each.
<h2>Conclusion</h2>
We’ve seen how to create 2 simple runbooks to start &amp; shut down VMs with an Azure Service Principal.

You could create multiple jobs using different schedule and different tags.  For instance, you might want your developer VMs to be off during a certain schedule but your QA to be off on a different schedule.  By assigning different tags to different VMs, this would be easily accomplished.

<strong>UPDATE (05-02-2016):  In some cases, your VM might fail to restart.  Read <a href="https://azure.microsoft.com/en-us/blog/allocation-failure-and-remediation/" target="_blank">Allocation Failure and Remediation</a> to understand why.  The solution to that would be to destroy the VMs (keep the VHDs) (instead of simply shutting them down) and recreating them.  A colleague of mine wrote the post <a href="https://alexandrebrisebois.wordpress.com/2015/11/29/on-off-done-right-on-azure/" target="_blank">On &amp; Off – Done Right on Azure</a> to explain how to go about it.  You could hook up those scripts in the automation built here and have a failure-resistant automation.  Those script wouldn't be generic though:  they would depend on your VM configuration.</strong>

&nbsp;