---
title:  Azure Export Template - Your new best friend
date:  2016-05-29 19:00:18 -04:00
permalink:  "/2016/05/29/azure-export-template-your-new-best-friend/"
categories:
- Solution
tags:  []
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="From https://pixabay.com" src="http://vincentlauzon.files.wordpress.com/2016/05/grid-871475_6401.jpg" alt="From https://pixabay.com" width="462" height="346" align="right" border="0" /><a href="https://azure.microsoft.com/en-us/documentation/articles/resource-group-overview/" target="_blank">Azure Resource Manager</a> (ARM) basically is Azure Infrastructure version 2.0.  It has been released for about a year now, although not all Azure Services have caught up yet.

With ARM comes <a href="https://azure.microsoft.com/en-us/documentation/articles/resource-group-authoring-templates/" target="_blank">ARM templates</a>.  An ARM template is a <em>description</em> of a group of resources (and their dependencies) in JSON.  It’s a powerful mechanism to deploy resources in Azure and replicate environments (e.g. ensuring your pre-prod &amp; prod are semi-identical).

Up until a few months ago, the only way to create an ARM template was to either build it from scratch or modify an existing one.  You can see examples of ARM templates in the <a href="https://azure.microsoft.com/en-us/documentation/templates/" target="_blank">Azure Quickstart Templates</a>.

Enter <em>Export Template</em>.
<h2>Your new best friend</h2>
If you have authored ARM templates, you know this can be a laborious process.  The JSON dialect is pretty verbose with limited documentation and each iteration you trial involves deploying Azure resources which isn’t as fast as testing HTML (to put it lightly).

A more natural workflow is to create some resources in an Azure Resource Group, either via the portal or PowerShell scripts, and then have Azure authoring a template corresponding to those resources for you.

This is what Export Template does for you.

Open your favorite Resource Group and check at the bottom of the settings:

<a href="http://vincentlauzon.files.wordpress.com/2016/05/image1.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/05/image_thumb1.png" alt="image" width="240" height="232" border="0" /></a>

When you click that option, you’ll get a JSON template.  That template, running on an empty Resource Group would recreate the same resources.

One nice touch of that tool is that it infers parameters for you.  That is, knowing the resources you have, it figures out what attribute would make sense in parameters.  For example, if you have a storage account, since the name needs to be globally unique (across all subscriptions in Azure, yours &amp; others), it would make sense you do not hardcode the name, so it would put it as a parameter with the current value as a default.

<a href="http://vincentlauzon.files.wordpress.com/2016/05/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/05/image_thumb3.png" alt="image" width="640" height="444" border="0" /></a>
<h2>Conclusion</h2>
As usual, there is no magic ; so for services not yet supported in ARM, this tool won’t give you a template for those.  It will warn you about it though.

For all supported scenarios, this is a <strong>huge time saver</strong>.  Even if you just use it as a starting point and modify it, it’s much faster than starting from scratch.

Remember that the aim of an ARM template is to describe an entire Resource Group.  Therefore the <em>Export Template</em> is a Resource Group tool (i.e. it’s in the menu of your Resource Group) and it wraps all the resources in your group.