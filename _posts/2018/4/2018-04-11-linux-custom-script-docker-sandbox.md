---
title:  Linux Custom Script - Docker Sandbox
date:  2018-04-11 06:30:30 -04:00
permalink:  "/2018/04/11/linux-custom-script-docker-sandbox/"
categories:
- Solution
tags:
- Automation
- Containers
- Virtual Machines
---
<a href="assets/2018/4/linux-custom-script-docker-sandbox/boy-child-childhood-6459.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="boy-child-childhood-6459" src="assets/2018/4/linux-custom-script-docker-sandbox/boy-child-childhood-6459_thumb.jpg" alt="boy-child-childhood-6459" width="320" height="213" align="right" border="0" /></a>I do a lot of proof of concepts (POCs) as part of my job.

I hate keeping demo environment around.  They tend to become brittle, out-of-date and filled with the last stuff I did.

I prefer to start from a clean slate every single time when possible.

That means automation.  With automation we can recreate whatever we need on demand.  This way we have a clean environment every single time.  No longer “it worked on my environment I’ve been fiddling with for the last 6 months”.

A very useful tool for automating the configuration of VM is the <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/linux/extensions-customscript">Linux Custom Script</a>.  This VM extension allows us to inject a script on a VM.  We can use that script to configure our VM.  It integrates with ARM template:  we will then deploy a fully configured VM in one go.

In our <a href="https://vincentlauzon.com/2018/04/04/overview-of-docker-containers-in-azure/">last article</a>, we looked at Docker Containers.  Before we get our hands dirty with Docker itself, we would need a place to play, a sandbox.  Somehow the Docker images (i.e. published by Docker) from the Azure Marketplace do not work this week.  I thought it would be a good opportunity to demo the Linux Custom Script.

I could have installed Docker on my laptop and be done with it.  But I like to have a clean environment every time and I like to keep my laptop as close to “factory setting” as possible.  For this reason I always use VMs for Docker.  I always need to refer to the install procedure.  That is tedious and has nothing to do with Docker.  I prefer automation!

To throw a little twist, the ARM template we’re going to build supports two OS.  We support Ubuntu &amp; CentOS (the open source little brother of Red Hat Linux).  We are going to use Logical Functions in ARM to support both.

<a href="https://github.com/vplauzon/containers/tree/master/DockerVM">The result is available on GitHub</a> with deployment buttons, ready to use.
<h2>Installing Docker</h2>
Installing Docker is part of all good Docker tutorial.  But as with most software, the install has little to do with mastering the software.  Or at least, in this day and age, it shouldn’t.

We can find the instructions on <a href="https://www.docker.com/community-edition">how to install Docker Community Edition (CE) here</a>.  There is a listing of all supported OS with links to specific instructions for each.

<a href="https://docs.docker.com/install/linux/docker-ce/ubuntu/">Ubuntu’s instructions are here</a> while <a href="https://docs.docker.com/install/linux/docker-ce/centos/">CentOS instructions are here</a>.

To script those instructions, we proceeded as follow:
<ul>
 	<li>Create a clean VM</li>
 	<li>Go through the instructions on that VM</li>
 	<li>Paste every instructions in a separate bash script (.sh)</li>
 	<li>Create another clean VM</li>
 	<li>Execute the bash script on it (in sudo)</li>
</ul>
It took one or two iterations to get it right.

The only alterations we did:
<ul>
 	<li>Skip most of the validation steps because we went quick and dirty</li>
 	<li>Remove ‘sudo’ in front of every instruction since the entire script is executed by root</li>
 	<li>The main install required a prompt, i.e. a user to type “yes”.  We added the “-y” switch to apt-get / yum to implement a silent mode.</li>
</ul>
Linux, with its package managers, makes it quite simple to automate installations.  It was quite straightforward and resulted in the following scripts:
<ul>
 	<li><a title="install-docker-cent-os.sh" href="https://github.com/vplauzon/containers/blob/master/DockerVM/DeployVM/install-docker-cent-os.sh">install-docker-cent-os.sh</a></li>
 	<li><a title="install-docker-ubuntu.sh" href="https://github.com/vplauzon/containers/blob/master/DockerVM/DeployVM/install-docker-ubuntu.sh">install-docker-ubuntu.sh</a></li>
</ul>
<h2>Installing Azure CLI</h2>
Similarly, we installed Azure CLI.

Instructions for installation on all OS are <a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli">here</a>.  Ubuntu's are <a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-apt">here</a>.  CentOS' are <a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-yum">here</a>.

Again, it was quite straightforward and resulted in the following scripts:
<ul>
 	<li><a title="install-docker-cent-os.sh" href="https://github.com/vplauzon/containers/blob/master/DockerVM/DeployVM/install-docker-cent-os.sh">install-docker-cent-os.sh</a></li>
 	<li><a title="install-docker-ubuntu.sh" href="https://github.com/vplauzon/containers/blob/master/DockerVM/DeployVM/install-docker-ubuntu.sh">install-docker-ubuntu.sh</a></li>
</ul>
<h2>ARM Template</h2>
We started with a vanilla VM deployment template.

We then added the <a href="https://docs.microsoft.com/en-us/azure/virtual-machines/linux/extensions-customscript">Custom Script Extension with Linux</a>.  Instructions are quite good and it’s simple enough:  pass a few URLs, only one in our case, then a command to execute.  It is important to note that we can only have one such extension.  This means we must package every script we want to run into one.  In our case we bootstrap the Docker &amp; Azure CLI install in one third script.

We always like to get the latest version of the ARM schemas, so <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.compute/virtualmachines/extensions">we looked at it here</a>.

In Visual Studio we can even add extension on VMs with right-clicks.

The extension resource is quite simple:

[code language="JavaScript"]
{
 &quot;type&quot;: &quot;extensions&quot;,
 &quot;name&quot;: &quot;[variables('Custom Script Name')]&quot;,
 &quot;tags&quot;: {},
 &quot;apiVersion&quot;: &quot;2017-12-01&quot;,
 &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
 &quot;dependsOn&quot;: [
 &quot;[resourceId('Microsoft.Compute/virtualMachines', variables('VM Name'))]&quot;
 ],
 &quot;properties&quot;: {
 &quot;publisher&quot;: &quot;Microsoft.Azure.Extensions&quot;,
 &quot;type&quot;: &quot;CustomScript&quot;,
 &quot;typeHandlerVersion&quot;: &quot;2.0&quot;,
 &quot;autoUpgradeMinorVersion&quot;: true,
 &quot;settings&quot;: {
 &quot;fileUris&quot;: &quot;[variables('Script URLs')]&quot;,
 &quot;commandToExecute&quot;: &quot;[variables('Command')]&quot;
 }
 }
}
[/code]

The template file is <a href="https://github.com/vplauzon/containers/blob/master/DockerVM/DeployVM/azuredeploy.json">available here on GitHub</a>.
<h2>Conditional deployment</h2>
Conditional deployment have existed for something like a year now.  We didn’t even use that to implement multiple OS.  We used the <em>if</em> function in the template.

We did all the work at the variable level so the resources would stay clean.

We use the parameter <em>Operating System</em>, which is of type string and can take the values <em>CentOS</em> &amp; <em>Ubuntu</em>.

We then defined a boolean variable <em>isCentOS</em>:

[code language="JavaScript"]

&quot;isCentOS&quot;: &quot;[if(equals(parameters('Operating System'), 'CentOS'), bool('true'), bool('false'))]&quot;

[/code]

From there we use that variable to define other variable.  Here is an example of the pattern:

[code language="JavaScript"]

&quot;VM CentOS Name&quot;: &quot;DockerCentOS-VM&quot;,
&quot;VM Ubuntu Name&quot;: &quot;DockerUbuntu-VM&quot;,
&quot;VM Name&quot;: &quot;[if(variables('isCentOS'), variables('VM CentOS Name'), variables('VM Ubuntu Name'))]&quot;,

[/code]

This way we can refer to the variable <em>VM Name</em> in the template and have no <em>if</em> in the template.

We managed to reuse the entire template this way without duplicating code.  Another approach is to use <em>condition</em> on resources.  We could then define 2 VM resources conditional on the OS.  That is the recommended approach.  We found that by using <em>if</em> conditions we were able to duplicate no code and still have a clean template.
<h2>Summary</h2>
We now have a Docker Sandbox we can spin in 5 minutes!

It also is a great example on how to implement simple Linux automation on Azure.  For more complicated setup we would recommend a configuration manager tool.  On Linux there is <a href="https://www.ansible.com/">Ansible</a>, <a href="https://www.chef.io/">Chef</a>, <a href="https://puppet.com/solutions/configuration-management">Puppet</a> (and many others).  On Windows we would recommend <a href="https://docs.microsoft.com/en-us/powershell/dsc/overview">Desired State Configuration</a> (DSC).