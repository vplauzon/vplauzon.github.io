---
title: Renaming Virtual Machine Disks
date: 2017-10-17 04:00:47 -07:00
permalink: /2017/10/17/renaming-virtual-machine-disks/
categories:
- Solution
tags:
- Virtual Machines
---
<a href="/assets/posts/2017/4/renaming-virtual-machine-disks/pexels-photo-2086371.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-208637[1]" src="/assets/posts/2017/4/renaming-virtual-machine-disks/pexels-photo-2086371_thumb.jpg" alt="pexels-photo-208637[1]" width="320" height="427" align="right" border="0" /></a>Let’s say we would like to rename disks on a Virtual Machine (VM).  Here we mean renaming the Azure Resource Name of the managed disk.  How would we go about that?

Why would we want to?  Primarily to get our internal nomenclature right.  A typical example is when we do migrate from unmanaged to managed disk (see <a href="https://vincentlauzon.com/2017/02/21/migrating-from-unmanaged-to-managed-disks/">article here</a>) using the <a href="https://docs.microsoft.com/en-us/powershell/module/azurerm.compute/convertto-azurermvmmanageddisk" target="_blank" rel="noopener">ConvertTo-AzureRmVMManagedDisk</a> command.  This command converts all disks from page blobs to managed disks ; it gives the managed disks the name of the page blob and prepend the name of the VM.  That might not be your nomenclature &amp; there is no way to override the names.

Nomenclature / naming convention is important if only to ensure clarity for human operators.
<h2>The Challenge</h2>
Our first challenge is that disks, like most Azure resources, can’t be renamed.  There is no such command.  For instance, if we look at <a href="https://docs.microsoft.com/en-us/powershell/module/azurerm.compute/update-azurermdisk?view=azurermps-4.4.0" target="_blank" rel="noopener">Update-AzureRmDisk</a>, it takes a disk object and the disk name is read only.

So we’ll need to actually copy the disks to change their names:  good old copy then delete the original scheme.

Our second challenge is that, as we’ve seen with the <a href="https://vincentlauzon.com/2017/10/16/azure-virtual-machines-anatomy/">Virtual Machine anatomy</a>, although data disks can be added and removed on the fly, the OS disk (i.e. primary disk) cannot.  That means we cannot swap the OS Disk to another disk.

<span style="background-color:orange;color:blue;"><strong>UPDATE (14-05-2018):  There now are commands to <em>swap</em> OS disks, both in PowerShell &amp; Azure CLI.  See <a style="color:#00ffff;" href="https://azure.microsoft.com/en-us/blog/os-disk-swap-managed-disks/">this article</a> for details.</strong></span>

We’ll need to recreate the VM to make it point to the disk copy with a new name.

So much for renaming, right?
<h2>The Solution</h2>
The solution we lay out here is based on ARM template.  You could accomplish something similar using PowerShell or Command Line Interface (CLI) scripts.

A demo of the solution is <a href="https://github.com/vplauzon/AzureVMs/tree/master/RenamingDiskSol" target="_blank" rel="noopener">available on GitHub</a>.  It deploys a Linux VM behind a public load balancer with SSH being routed to the VM.  In order to fully explore the demo, <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/classic/attach-disk#initialize-a-new-data-disk-in-linux" target="_blank" rel="noopener">we need to initializes the data disks</a>.

In general, the solution follows five steps:
<ol>
 	<li>Determine the Virtual Machine ARM template</li>
 	<li>Delete the Virtual Machine</li>
 	<li>Copy disks with new names</li>
 	<li>Re-create the Virtual Machine and attach to disk copies</li>
 	<li>Delete original disks</li>
</ol>
<h3>Determine the Virtual Machine ARM template</h3>
Since we’ll recreate the VM using ARM template, we need to determine the ARM Template of the VM.

If we already have it because we proceed with ARM template in general, then done.  Otherwise we need to work a little bit.

The best approach usually is to use the <em>Automation Script</em> option on the left hand side menu of either the VM or its resource group.

<a href="/assets/posts/2017/4/renaming-virtual-machine-disks/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/4/renaming-virtual-machine-disks/image_thumb3.png" alt="image" border="0" /></a>

From there we can find the node for our VM and then mechanically we can clean up the template.

We do not need the template for the entire resource group.  We only need the template for the VM itself (not its NICs or VNET, etc.).
<h3>Delete the Virtual Machine</h3>
Let’s delete the Virtual Machine to better recreate it.

We will use a PowerShell command.  Using the Azure Portal would yield the same result.

```PowerShell


$rgName = 'ren' # or the Resource Group name we use
$vmName = 'Demo-VM'    # or the name of the VM we use
Remove-AzureRmVM -Force -ResourceGroupName $rgName -Name $vmName

```

Of course, we need to replace the variable with values corresponding to our case at hand.

This deletes the VM but leaves all its artefact behind:  VNET, Public IP, NIC, Disks, etc.  .  We’ll be able to attach back to those.
<h3>Copy disks with new names</h3>
We’re going to use a new ARM template to copy disks.  Here is our <a href="https://github.com/vplauzon/AzureVMs/blob/master/RenamingDiskSol/RenamingDisk/RecreateVMDeploy.json" target="_blank" rel="noopener">demo solution’s template</a>.

Basically, the ARM templates create <a href="https://docs.microsoft.com/en-ca/azure/templates/Microsoft.Compute/disks" target="_blank" rel="noopener">new disks</a> using the <em>creationOption</em> value <em>copy</em>, pointing to the original disk of the VM.

For the demo solution, we use a fancy trick where we map the old and new disk name in a variable:

```PowerShell


"disks": [
  {
    "oldName": "Demo-VM-OS",
    "newName": "Clone-Demo-OS"
  },
  {
    "oldName": "Demo-VM-data2",
    "newName": "Clone-Demo-data2"
  },
  {
    "oldName": "Demo-VM-data3",
    "newName": "Clone-Demo-data3"
  }
]

```

and then we use a copy construct to loop to the JSON array:

```JavaScript


    {
      "comments": "Copy existing disks in order to change their names",
      "apiVersion": "2017-03-30",
      "copy": {
        "name": "snapshot-loop",
        "count": "[length(variables('disks'))]"
      },
      "type": "Microsoft.Compute/disks",
      "name": "[variables('disks')[copyIndex()].newName]",
      "location": "[resourceGroup().location]",
      "sku": {
        "name": "Premium_LRS"
      },
      "properties": {
        "creationData": {
          "createOption": "copy",
          "sourceUri": "[resourceId('Microsoft.Compute/disks', variables('disks')[copyIndex()].oldName)]"
        }
      }
    },


```

One of the advantage of using ARM templates to copy the disks is that the copy is parallelized:  in the case of our demo solution, we have 3 disks and they are copied in parallel instead of one after.  The is of course faster.
<h3>Re-create the Virtual Machine and attach to disk copies</h3>
In the same ARM template, we can recreate the VM.  This is what we do in our <a href="https://github.com/vplauzon/AzureVMs/blob/master/RenamingDiskSol/RenamingDisk/RecreateVMDeploy.json" target="_blank" rel="noopener">demo solution’s template</a> by adding a dependency on the disks.

The VM is recreated by <em>attaching to the disk copies</em>.  Similarly, it links back to its NIC.
<h3>Delete original disks</h3>
At this point we did “rename the disks”.  We just have some cleanups to do with the original disks.

We simply delete them:

```JavaScript


$rgName = ‘ren’ # or the Resource Group name you used
$oldDisks = 'Demo-VM-OS', 'Demo-VM-data2', 'Demo-VM-data3'

$oldDisks | foreach {Remove-AzureRmDisk -ResourceGroupName $rgName -Force -DiskName $_}

```

Again, replacing the first two variables by what make sense in our use case.
<h2>Summary</h2>
We did come up with a recipe to rename managed disks by copying them and attaching the copies to a recreated VM.

Our demo example had a lot of specifics:
<ul>
 	<li>It’s a Linux VM (Windows would be very similar)</li>
 	<li>It’s exposed through a load balancer on a public IP (this doesn’t matter, only its NIC matter ; the NIC is the one being load balanced)</li>
 	<li>It had 2 data disks</li>
</ul>
The solution would change depending on the specifics of the VM but the same steps would apply.