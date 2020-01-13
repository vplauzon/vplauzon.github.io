---
title: Finding a VM Image Reference, Publisher & SKU
date: 2018-01-10 03:30:09 -08:00
permalink: /2018/01/10/finding-a-vm-image-reference-publisher-sku/
categories:
- Solution
tags:
- Automation
- PowerShell
- Virtual Machines
---
<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/craftsman-3008031_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="craftsman-3008031_640" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/craftsman-3008031_640_thumb.jpg" alt="craftsman-3008031_640" align="right" border="0" /></a>Automation is great.

I love to script solutions in Azure.

But most of the time, that automation started with me fumbling and trialing different approaches in the portal.  Once I got something around what I wanted I’ll automate.

I suspect you do the same thing.

This is why today we’re going to look at how to find the image reference of your favorite VM images in the Azure Market Place.

For instance, when you look at some ARM template, how does the author found this piece of JSON?

[code language="Javascript"]

&quot;Image Reference&quot;: {
&quot;publisher&quot;: &quot;OpenLogic&quot;,
&quot;offer&quot;: &quot;CentOS&quot;,
&quot;sku&quot;: &quot;7.3&quot;,
&quot;version&quot;: &quot;latest&quot;
}

[/code]

We’ll look at a few ways to find that, both in the Portal and in PowerShell.
<h2>From the Azure Marketplace</h2>
Let’s assume we already found the VM image in the Azure Marketplace.

For instance, let’s say we like the Data Science Virtual Machine published by Microsoft.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image17.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb17.png" alt="image" border="0" /></a>

Well, let’s create one.  Or at least, let’s pretend we will create one.  Let’s fill all the sections to create the VM.

We won’t create it, so let’s not bother about configuring availability set and VNETs and choosing a great name for the administrator.  Let’s just type enough stuff to get pass the validation gate.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image20.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image20.png" alt="image" border="0" /></a>

At the last step, instead of clicking <em>Create</em>, right next to it is <em>Download Template and parameters</em>.  Let’s click that.

We are taken to an ARM template visualizer.  This is the ARM template the Portal would run for us if we would hit “create”.

On the left-hand side menu, let’s open the <em>Resources</em> node and look for the VM icon &amp; click on it.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image19.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb19.png" alt="image" border="0" /></a>

Scrolling down we should find the <em>storageProfile</em> JSON node and the <em>imageReference</em> under it.  This is what we are looking for:

[code language="Javascript"]

&quot;imageReference&quot;: {
&quot;publisher&quot;: &quot;microsoft-ads&quot;,
&quot;offer&quot;: &quot;windows-data-science-vm&quot;,
&quot;sku&quot;: &quot;windows2016&quot;,
&quot;version&quot;: &quot;latest&quot;
}

[/code]

Boom.  Pause for effect.
<h2>Existing Deployment</h2>
Now let’s assume that we do not remember what image we choose.  We did that a few months ago, it still is in our Azure subscription but we got no idea what exact image we picked.

No worries.  Let’s go to the resource group where that VM is hiding.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image21.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb21.png" alt="image" border="0" /></a>

Let’s select the <em>Deployments</em> tab.  This shows us the list of deployments (ARM Template deployments that is) that has occurred in that resource group.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image22.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb22.png" alt="image" border="0" /></a>

Here the initial deployment is more than 2 months old.

In the example above we have a few deployments because there is more than one VM in that resource group.  The deployment name should tip us into what they are about.  Here, let’s select the RedHat one.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image23.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb23.png" alt="image" border="0" /></a>

We can see some deployment details.  On the top right have this <em>View template</em> button.  It will lead us to the ARM template used in this deployment.

From there, we can find what we are looking for the same way we did in the previous section.
<h2>Using PowerShell</h2>
Now it might be interesting to explore the quadruple (i.e. publisher, offer, sku, version) and some variations.  For that scripting is required.  Let’s start with PowerShell.

First, we’ll need to target an Azure region.  Easy enough, let’s choose.

[code language="PowerShell"]

Get-AzureRmLocation | select Location

[/code]

Let’s say we choose <em>northcentralus</em> (North Central USA).  We can now look at the publishers available in that region.

[code language="PowerShell"]

$location = &quot;northcentralus&quot;

Get-AzureRmVMImagePublisher -Location $location

[/code]

We might want to narrow it down.  For example we might want to look at only Microsoft-related ones

[code language="PowerShell"]

Get-AzureRmVMImagePublisher -Location $location | where {$_.PublisherName.Contains(&quot;microsoft&quot;)}

[/code]

which gives us a shorter list.

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image24.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb24.png" alt="image" border="0" /></a>

(Actually, this is for Microsoft in lower-case specifically ; if we want anything Microsoft the filter would be <em>$_.PublisherName.ToLower().Contains("microsoft")</em> and returns a much longer list)

Let’s say we choose <em>microsoft-ads</em>.  We can look at the offering of that publisher.

[code language="PowerShell"]

$publisher = &quot;microsoft-ads&quot;

Get-AzureRmVMImageOffer -Location $location -PublisherName $publisher

[/code]

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image25.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb25.png" alt="image" border="0" /></a>

Let’s say we picked the first one and look at the different skus available.

[code language="PowerShell"]

$offer = &quot;linux-data-science-vm&quot;

Get-AzureRmVMImageSku -Location $location -PublisherName $publisher -Offer $offer

[/code]

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image26.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb26.png" alt="image" border="0" /></a>

Again, let’s say we picked the first one, we can now look at all the versions available:

[code language="PowerShell"]

$sku = &quot;linuxdsvm&quot;

Get-AzureRmVMImage -Location $location -PublisherName $publisher -Offer $offer -Skus $sku

[/code]

<a href="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image27.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2018/1/finding-a-vm-image-reference-publisher-sku/image_thumb27.png" alt="image" border="0" /></a>

Usually we simply specify “latest” for the version, but it could be useful to know which versions are available.

So now we have it, within a location we got the quadruple ($publisher, $offer, $sku, $version).
<h2>Summary</h2>
VM Image Reference seem to be one of those magic element that just falls on the lap of the worthy.  But as we’ve shown, there is nothing mysterious about them.

We can easily reverse engineer the image reference from something we’ve already created in the portal and we can also explore the offerings using PowerShell scripts.