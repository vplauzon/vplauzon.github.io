---
title:  Azure Runbook - A complete (simple) example
date:  2015-11-01 19:00:17 -05:00
permalink:  "/2015/11/01/azure-runbook-a-complete-simple-example/"
categories:
- Solution
tags:
- Automation
---
I meant to write about Azure Runbooks (also known as <a href="https://azure.microsoft.com/en-us/services/automation/" target="_blank">Azure Automation</a>) for quite a while.

I had the chance to be involved in the operations of a solution I helped architect.  When you get beyond trivial Azure Solution, like on premise, you'll want to have some automations.  For instance, you'll want to:
<ul>
	<li>Clean up data at the end of the day</li>
	<li>Probe a few services for health check</li>
	<li>Execute some data batch</li>
	<li>etc.</li>
</ul>
Azure is mature enough already that you could do that with other technology.  For instance a mix of <a href="https://azure.microsoft.com/en-us/services/scheduler/" target="_blank">Scheduler</a> and Web Job.  But those approaches are a little complicated for PowerShell automation and not ideal for long-running workflows.

Azure Automation is more appropriate for those scenarios.
<h2>The example</h2>
I'll give a simple example here.  We'll build an automation scanning a blob container and deleting all the blobs matching a certain name pattern.  That job will run every hour.

I'll construct that using a PowerShell workflow.  I won't go into the graphical tool yet nor will I create a custom PowerShell module.  As you'll see the script will only take a few lines.  Such simple workflow do not mandate modules or graphical workflows in my opinion.
<h2>Creating a Resource Group</h2>
I won't go into ARM templates but we'll build this example into a Resource Group so at the very least, you'll be able to destroy all artefacts in one go at the end (by destroying the Resource Group).

So let's go in the <a href="https://portal.azure.com/" target="_blank">Preview Portal</a> to create a new Resource Group.  In the home page, select <em>Resource groups</em>.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps.jpg"><img class="alignnone size-full wp-image-1328" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps.jpg" alt="Steps" width="700" height="323" /></a>

Then select Add.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps1.jpg"><img class="alignnone size-full wp-image-1329" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps1.jpg" alt="Steps" width="700" height="281" /></a>

This should pop up the following blade.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps2.jpg"><img class="alignnone size-full wp-image-1330" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps2.jpg" alt="Steps" width="594" height="664" /></a>

As <em>Resource Group Name</em>, type <em>SampleAutomations</em>.

Select the <em>Subscription</em> you wanna use.

<em>Locate</em> the Resource Group where it's more convenient for you.

Then click on the <em>Create</em> button at the bottom of the blade.
<h2>Creating Automation Account</h2>
Let's create an Automation Account.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps6.jpg"><img class="alignnone size-full wp-image-1335" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps6.jpg" alt="Steps" width="700" height="477" /></a>

Give it a unique name (I used <em>myfirstautomation</em>), ensure it is in the resource group we created and in a suitable region (not all regions are supported yet) and click the <em>Create</em> button.
<h2>Exploring Automation Account</h2>
Let's open the newly created account.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps7.jpg"><img class="alignnone size-full wp-image-1336" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps7.jpg" alt="Steps" width="700" height="324" /></a>

Runbooks are <a href="https://technet.microsoft.com/en-us/library/jj134242.aspx" target="_blank">PowerShell workflows</a>.  In a nutshell those are a mix of PowerShell scripts and Workflow Foundation (WF) worflows.  They allow long running workflows, pauses, restart, etc.  You already have a runbook, it's the tutorial runbook.  You can look at it.

Assets come in different forms:
<ul>
	<li>Schedules</li>
	<li>Modules</li>
	<li>Certificates</li>
	<li>Connections</li>
	<li>Variables</li>
	<li>Credentials</li>
</ul>
We are going to use a schedule to run our run book.  We are also going to use variables to store configuration about our run book.
<h2>Creating Storage Account</h2>
Before we create our run book we need a storage account.

We're going to create a storage account within the Resource Group we've created.  Click the plus button at the top left of the portal.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps3.jpg"><img class="alignnone size-full wp-image-1331" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps3.jpg" alt="Steps" width="536" height="316" /></a>

Select <em>Data + Storage</em> then select <em>Storage Account</em>.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps4.jpg"><img class="alignnone size-full wp-image-1332" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps4.jpg" alt="Steps" width="592" height="208" /></a>

Then at the bottom of the <em>Storage Account</em> pane, select "<em>Resource Manager</em>" and click <em>Create</em>.

Name the account something unique (I used <em>mysample2015</em>).

In <em>Resource Group</em>, make sure to select the resource group you just created.  Make sure the location suits you and click <em>Create</em>.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps5.jpg"><img class="alignnone size-full wp-image-1334" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps5.jpg" alt="Steps" width="526" height="1069" /></a>
<h2>Creating Storage Container</h2>
Using your favorite Azure Storage tool (I used <a href="http://clumsyleaf.com/products/cloudxplorer" target="_blank">CloudXplorer</a>), create a container named <em>my-watched-container</em>.

For the runbook to access to container, we'll use a <em>Shared Access Signature</em> (<a href="https://azure.microsoft.com/en-us/documentation/articles/storage-dotnet-shared-access-signature-part-1/" target="_blank">SAS</a>) token.  Whenever you can, use the access mechanism giving as little access as possible.  This way, if your assets get compromised, the attacker can do less damage than if you stick the keys of the castle in there.  This is the <a href="https://en.wikipedia.org/wiki/Principle_of_least_privilege" target="_blank">least privilege principle </a>and you should always apply it.

So, for that newly created container, create a SAS token allowing for listing and deleting.  This is what our runbook will do:  list the blobs, delete the ones matching a certain pattern.
<h2>Creating Variables</h2>
Let's create the variables for our run book.

Go back to the run book, select assets then select variables then add variable.

Give it <em>accountName</em> as a <em>Name</em>, leave the default <em>string type </em>there and for <em>value</em>, input the name of the storage account you created.  Then click create.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps8.jpg"><img class="alignnone size-full wp-image-1337" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps8.jpg" alt="Steps" width="535" height="1067" /></a>

Do the same for the following:
<table>
<thead>
<tr style="background:orange;">
<th>Name</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td width="364">containerName</td>
<td width="364">my-watched-container</td>
</tr>
<tr>
<td width="364">pattern</td>
<td width="364">draft</td>
</tr>
<tr>
<td width="364">sas</td>
<td width="364">The value of the sas token you created for your container.  This should start with the question mark of the query string.</td>
</tr>
</tbody>
</table>
For the last one, select the encrypted option.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps9.jpg"><img class="alignnone size-full wp-image-1338" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps9.jpg" alt="Steps" width="552" height="382" /></a>

This will make the variable inaccessible to operators in the future.  It’s an added level of security.

You should have the following variables defined.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps10.jpg"><img class="alignnone size-full wp-image-1339" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps10.jpg" alt="Steps" width="700" height="407" /></a>
<h2>Creating Runbook</h2>
Let’s create the runbook.  Let’s close the <em>Variables</em> and <em>Assets</em> blade.

Let's select the Runbooks box and click the <em>Add a run book</em> button. Select <em>Quick Create</em>.

For <em>Name</em>, input <em>CleanBlobs</em>. For <em>Runbook type</em>, choose <em>PowerShell Workflow</em>. Hit the <em>Create</em> button.

This is the code of our Workflow. Let's paste in the following:

<em>workflow CleanBlobs
{
InlineScript
{
# Here we load all the variables we defined earlier
$account = Get-AutomationVariable -Name 'accountName'
$container = Get-AutomationVariable -Name 'containerName'
$sas = Get-AutomationVariable -Name 'sas'
$pattern = Get-AutomationVariable -Name 'pattern'</em>

# Construct a context for the storage account based on a SAS
$context = New-AzureStorageContext -StorageAccountName $account -SasToken $sas

# List all the blobs in the container
$blobs = Get-AzureStorageBlob -container $container -Context $context

$filteredBlobs = $blobs | where-object {$_.Name.ToUpper().Contains($pattern.ToUpper())}

$filteredBlobs | ForEach-Object {Remove-AzureStorageBlob -blob $_.Name -Context $context -Container $container}
}
}

You can see how we are using the variables by calling the cmdlet <em>Get-AutomationVariable</em>. You could actually discover that by opening the <em>Assets</em> tree view on the left of the edit pane.

We can then test our Run book by hitting the <em>test</em> button on top. First you might want to insert a few empty file in your blob container, with some containing the word "draft" in them.  Once the workflow ran, it should have deleted the draft files.
<h2>Scheduling Runbook</h2>
Let’s schedule the runbook.  First let's publish it.  Close the test pane and click the <em>Publish</em> button.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps11.jpg"><img class="alignnone size-full wp-image-1341" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps11.jpg" alt="Steps" width="700" height="268" /></a>

Then click the <em>Schedule</em> button and <em>Link a schedule to your runbook</em>.

<a href="/assets/2015/11/azure-runbook-a-complete-simple-example/steps12.jpg"><img class="alignnone size-full wp-image-1342" src="/assets/2015/11/azure-runbook-a-complete-simple-example/steps12.jpg" alt="Steps" width="700" height="416" /></a>

We didn't create any schedule yet, so let's create one in place.  Give it any name, set the recurrence to hourly and hit the create button.

By default the start time will be 30 minutes from now.  At the time I wrote this blog, there was a little bug in the interface forbidding me to put it in 5 minutes (because of time zone calculations).  That might be fix by the time you try it.

Click ok and your workbook is scheduled.
<h1>Summary</h1>
Azure Automation is a powerful tool to automate tasks within Azure.

In this article I only touched the surface.  I will try to go further in future posting.