---
title:  Azure Virtual Machines Anatomy
date:  2017-10-16 06:00:38 -04:00
permalink:  "/2017/10/16/azure-virtual-machines-anatomy/"
categories:
- Solution
tags:
- Networking
- Virtual Machines
---
<a href="assets/2017/10/azure-virtual-machines-anatomy/hand-2194170_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="hand-2194170_640" src="assets/2017/10/azure-virtual-machines-anatomy/hand-2194170_640_thumb.jpg" alt="hand-2194170_640" width="320" height="213" align="right" border="0" /></a>Virtual Machines can be pretty complex little beast.  They can have multiple disks, multiple NICs in different subnets, can be exposed on the public internet either directly or through a load balancer, etc.  .

In this article, we’ll look at the anatomy of a Virtual Machine (VM):  what are the components it relates to.

We look at the Azure Resource Model (ARM) version of Virtual Machine, as opposed to Classic version.  In ARM, Virtual Machines have a very granular model.  Most components that relate to a VM are often assimilated to the VM itself when we conceptualize them (e.g. NIC).
<h2>Internal Resource Model</h2>
Here is component diagram.  It shows the different components, their relationship and the cardinality of the relationships.

<a href="assets/2017/10/azure-virtual-machines-anatomy/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/10/azure-virtual-machines-anatomy/image_thumb2.png" alt="image" border="0" /></a>
<h3>Virtual Machine</h3>
Of course, the Virtual Machine is at the center of this diagram.  We look at the other resources in relationship to a Virtual Machine.
<h3>Availability Set</h3>
A Virtual Machine can optionally be part of an availability set.

Availability Set is a reliability construct.  <a href="https://vincentlauzon.com/2015/10/21/azure-basics-availability-sets/">We discuss it here</a>.
<h3>Disk</h3>
A Virtual Machine has at least one disk:  the Operating System (OS) disk.  It can optionally have more disks, also called <em>data disks</em>, as much as the Virtual Machine SKU allows.
<h3>Network Interface Controller (NIC)</h3>
NIC is the Networking bridge for the Virtual Machine.

A Virtual Machine has at least one (and typical VMs have only one) but can have more.  <a href="https://azure.microsoft.com/en-us/solutions/network-appliances/" target="_blank" rel="noopener">Network Virtual Appliances</a> (NVAs) are typical cases where multiple NICs are warranted.

We often say that a Virtual Machine is in a subnet / virtual network and we typically represent it that way in a diagram:  a VM box within a subnet box.  Strictly speaking though, the NIC is part of a subnet.  This way a Virtual Machines with multiple NICs could be part of multiple subnets <span style="text-decoration:line-through;">which might be from different Virtual Networks</span> in the same Virtual Network.

<strong>UPDATE (26-10-2017)</strong>:  <em>I previously wrote that multiple NICs from different Virtual Network was possible.  <span style="text-decoration:underline;">It isn't</span>.  If a VM has multiple NICs, they can be from different subnets but they must be from the same Virtual Network.</em>

A NIC can be load balanced (in either a private or public load balancer) or can also be exposed directly on a Public IP.
<h3>Subnet / Virtual Network</h3>
Azure Virtual Network are the Networking isolation construct in Azure.

A Virtual Network can have multiple subnets.

A NIC is part of a subnet and therefore has a private IP address from that subnet.  The private IP address can be either static (fixed) or dynamic.
<h3>Public Azure Load Balancer</h3>
On the diagram we distinguish between Public &amp; Private Load Balancers but they are the same Azure resource per se although used differently.

A Public Load Balancer is associated with a Public IP.  It is also associated to multiple NICs to which it forwards traffic.
<h3>Public IP</h3>
A public IP is exposed on the public internet.  The actual IP address can be either static or dynamic.

A public IP routes traffic to NICs either through a public load balancer or directly to a NIC (when the NIC exposes a public IP directly).
<h3>Private Azure Load Balancer</h3>
A private load balancer forwards traffic to multiple NICs like a public load balancer.

A private load balancer isn’t associated to a public IP though.  It has a private IP address instead and is therefore part of a subnet.
<h2>Cast in stone</h2>
<a href="assets/2017/10/azure-virtual-machines-anatomy/pexels-photo-961271.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="pexels-photo-96127[1]" src="assets/2017/10/azure-virtual-machines-anatomy/pexels-photo-961271_thumb.jpg" alt="pexels-photo-96127[1]" width="320" height="213" align="left" border="0" /></a>We looked at VM components.  That gives us a static view of what a VM is.

Another interesting aspect is the dynamic nature of a VM.  What can change and what cannot?

For better or worse we can’t change everything about a VM once it’s created.  So let’s mention the aspect we can’t change after a VM is created.

The primary NIC of a VM is permanent.  We can add, remove or change secondary NICs but the primary must stay there.

Similarly, the primary disk, or <em>OS disk</em>, can’t be changed after creation while secondary disks, or <em>data disks</em>, can be changed.

The availability set of a VM is set at creation time and can’t be changed afterwards.
<h2>Summary</h2>
We did a quick lap around the different resources associated to a Virtual Machine.

It is useful to keep that mental picture when we contemplate different scenarios.