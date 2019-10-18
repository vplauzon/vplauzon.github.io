---
title:  Moving from Standard to Premium disks and back
date:  2017-09-27 21:14:05 +00:00
permalink:  "/2017/09/27/moving-from-standard-to-premium-disks-and-back/"
categories:
- Solution
tags:
- PowerShell
- Virtual Machines
---
<a href="https://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Azure Managed Disks</a> (introduced in February 2017) simplified the way Virtual Machine disks are managed in Azure.

A little known advantage of that resource is that it exposes its storage type, i.e. Standard vs Premium, as a simple property that can easily be changed.

Why would we do that?  Typically we’ll move from standard to premium storage to improve the disk latency but also its resilience (for instance, only VMs with Premium disks can have a <a href="https://vincentlauzon.com/2016/11/23/single-vm-sla/">Single-VM SLA</a>).  We might want to move from Premium to Standard in order to drive the cost of solution down, although the storage rarely dominates the cost of a solution.

In general, it can be interesting to test performance on both.  As with many things in Azure, you can quickly do it, so why not?
<h1>Managed Disks</h1>
For this procedure to work, we need managed disk.

If our Virtual Machine have unmanaged disks (aka .vhd file in a blob storage container), we do need to convert them to managed disk first.

Fortunately, there is a <a href="https://vincentlauzon.com/2017/02/21/migrating-from-unmanaged-to-managed-disks/">simple procedure to migrate to managed disk</a>.
<h1>Portal Experience</h1>
Let’s start with the portal experience.

First, let’s open a Resource Group where I know I do have some VMs.

<a href="assets/2017/9/moving-from-standard-to-premium-disks-and-back/image4.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="assets/2017/9/moving-from-standard-to-premium-disks-and-back/image_thumb4.png" alt="image" border="0" /></a>

There are two resources that should interest us in there.

The first one is a Virtual Machine.  We’ll need to make sure Virtual Machines are shutdown from the portal’s perspective, i.e. they aren't provisioned anymore (as opposed to doing a shutdown from within the VMs).

The second resource is a disk.  Let’s click on that one.

<a href="assets/2017/9/moving-from-standard-to-premium-disks-and-back/image5.png"><img style="border:0 currentcolor;margin-right:auto;margin-left:auto;float:none;display:block;background-image:none;" title="image" src="assets/2017/9/moving-from-standard-to-premium-disks-and-back/image_thumb5.png" alt="image" border="0" /></a>

Changing the account type is right on the overview tab of the disk resource.  We can simply change it, hit save, and within seconds the disk is marked as changed.

What really happens is that a copy is triggered in the background.  The disk can be used right way thanks to a mechanism called “copy on read”:  if the VM tries to read a page of the disk which hasn’t been copied yet, that page will be copied first before the read can occur.

For this reason we might experiment a little more latency at first so for performance test it is better to wait.  There are no mechanism to know when the background copy is completed so it is best to assume the worst for performance test.
<h1>PowerShell Script</h1>
The Portal Experience is quite straightforward, but as usual, automation via PowerShell scripts often is desirable if we have more than a handful of migration to do.  For instance, if we have 10 disks to migrate

As with the Portal Experience, we need to shutdown the impacted Virtual Machines first.  This can also be done using PowerShell scrip but I won't cover it here.

The main cmdlets to know here are Get-AzureRmDisk &amp; Update-AzureRmDisk.

We first do a GET in order to get the disk meta-data object, we then change the <em>AccountType</em> property and do an UPDATE to push back the change.

In the following example, I zoom in to a Resource Group and convert all the disks to Premium storage:

[code language="PowerShell"]

$rg = &quot;Docker&quot;

Get-AzureRmDisk -ResourceGroupName $rg | foreach {
    $disk = $_
    $disk.AccountType = &quot;PremiumLRS&quot;
    Update-AzureRmDisk -ResourceGroupName $disk.ResourceGroupName -DiskName $disk.Name -Disk $disk
}

[/code]

The property <em>AccountType</em> can take the following values:
<ul>
 	<li>StandardLRS</li>
 	<li>PremiumLRS</li>
</ul>
<h2>Summary</h2>
We’ve seen how to easily migrate from one type of storage to another with Azure Virtual Machine Managed Disks.

This allows us to quickly change the property of an environment either permanently or in order to test those parameters (e.g. performance, stability, etc.).