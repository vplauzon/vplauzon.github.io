---
title:  Recurrent serverless batch job with Azure Batch
date:  2017-12-20 06:30:40 -05:00
permalink:  "/2017/12/20/recurrent-serverless-batch-job-with-azure-batch/"
categories:
- Solution
tags:
- Serverless
- Virtual Machines
---
<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/pexels-photo-2962301.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="Dig garden" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/pexels-photo-296230_thumb1.jpg" alt="Dig garden" width="320" height="212" align="left" border="0" /></a>Most solutions have recurrent batch jobs, e.g. nightly / end-of-month batch jobs.

There are many services we can leverage in Azure to run those.  In this article, we are going to explore a service that has “Batch” in its name:  Azure Batch.

Azure Batch is typically positioned for big compute since it easily schedule jobs to run on a cluster of VMs.  But configured properly, it can also run recurrent jobs in a serverless manner.

Azure Batch supports auto-scaling:  the number of nodes in the cluster can vary in function of the load.
<h2>Azure Batch</h2>
A typical workflow for an Azure Batch workload is:
<ul>
 	<li>Create a job</li>
 	<li>Populate the job with a series of tasks representing part of a problem resolution</li>
 	<li>Tasks get scheduled on different nodes</li>
 	<li>Job completes</li>
</ul>
For instance, let’s consider the 3D image rendering problem.  We can breakdown the image in many pieces and spread the rendering of each piece in different tasks.  This allows to leverage many nodes (VMs) in the Batch cluster, hence the <em>Big Compute</em>.

Often the cluster size is fixed but we could also implement auto scaling, where a formula computing the size of the cluster is periodically evaluated.  Typically the formula looks at the number of pending tasks to determine the number of nodes.

In our case, we need to run something much simpler:  one job, one task, running once in a while (on a schedule).  The workflow is hence much simpler:
<ul>
 	<li>Job &amp; only task is created by the scheduler</li>
 	<li>Task gets scheduled on an empty cluster</li>
 	<li>Auto scaling kicks in, increasing the size of the cluster from 0 to 1 node</li>
 	<li>Task get executed</li>
 	<li>Job completes</li>
 	<li>Auto scaling kicks in again, decreasing the size of the cluster from 1 to 0 node</li>
</ul>
Here we're going to use a simple auto scaling formula:  if there is any task to run, the cluster should have one node ; otherwise, the cluster should be empty (and run at no cost).  This is what we mean by <em>serverless</em> in this article.  The servers are fully managed and ephemeral.

With some simple configuration we therefore change a service designed to run massive workload into a service running small workload periodically economically.

While we’re at pinching pennies for this solution, we’re going to leverage <a href="https://docs.microsoft.com/en-us/azure/batch/batch-low-pri-vms" target="_blank" rel="noopener">Low-Priority VMs</a>.
<h2>Sample</h2>
<a href="https://github.com/vplauzon/batch/tree/master/PythonBatch" target="_blank" rel="noopener">The sample we are going to walk through is on Github</a>.

We are going to run a job written in <a href="https://docs.microsoft.com/en-us/azure/batch/batch-python-tutorial#step-5-add-tasks-to-job" target="_blank" rel="noopener">Python</a> on a <a href="https://docs.microsoft.com/en-us/azure/batch/batch-linux-nodes" target="_blank" rel="noopener">Linux cluster</a>, but we could easily reconfigure the sample to run on Windows or different platform (.NET, Java, Shell script, PowerShell, etc.).  Anything that can be invoked from a command line can be run on Azure Batch.

We are going to install some custom software before running our batch to make sure we cover scenarios where this is required.  This is often necessary since we start from a vanilla VM having only the OS installed.  We can also use a custom image with all our software pre-installed.
<h2>Deploy ARM Template</h2>
To accelerate the treatment we automated the deployment as much as possible.

Azure Batch can’t be fully configured using ARM template at the time of this writing (mid December 2017).  For this reason, we do a first pass with ARM template, then another pass with a PowerShell script (which could easily be converted in a CLI script and run on MacOS / Linux) and finally we’ll do the final configuration using the Portal.

We can deploy the ARM template by using the following link:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fbatch%2Fmaster%2FPythonBatch%2FPythonBatchDeploy%2Fazuredeploy.json" target="_blank" rel="noopener">
<img src="http://azuredeploy.net/deploybutton.png" />
</a>

<a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.batch/batchaccounts" target="_blank" rel="noopener">Schema for Batch Account ARM template can be found here</a>.

This template requires three parameters:
<ul>
 	<li>Storage Account Name:  it needs to be globally unique</li>
 	<li>Batch Account Name:  it also need to be unique within the Azure region</li>
 	<li>VM Size:  by default it is set to Standard DS-2 v2</li>
</ul>
The template will provision:
<ul>
 	<li>A storage account used by the batch account</li>
 	<li>A batch account</li>
 	<li>An auto scaled pool within the batch account</li>
</ul>
We can look at the batch account in the Portal once it is provisioned.  More specifically, we can look at the provisioned pool, aptly named <em>mainPool</em>.  We see it has no dedicated nor low-priority nodes.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb4.png" alt="image" border="0" /></a>

If we select the pool, we can then go to its <em>Scale</em> configuration.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb12.png" alt="image" border="0" /></a>

We see the template configured it to be auto-scalling.  The formula is evaluated every 5 minutes.  It basically evaluates if there has been any pending task in the last 180 seconds.  If so, it mandates to have a low priority node, otherwise the target is zero nodes.
<p align="left"><a href="https://docs.microsoft.com/en-us/azure/batch/batch-automatic-scaling" target="_blank" rel="noopener">Auto scaling formula in Azure Batch is explained in the online documentation</a>.</p>
We can force the evaluation of the formula.  When we just provisioned the cluster, it is likely to evaluate to force a one-node cluster.  This is a side-effect of how the formula is written.  After a few minutes, the cluster will scale back to zero node.

Now we have a batch account with a pool configured, but we have nothing running on it.
<h2>PowerShell Script</h2>
The next step is to run the PowerShell script <a href="https://github.com/vplauzon/batch/blob/master/PythonBatch/PythonBatchDeploy/DeployBatchComponents.ps1" target="_blank" rel="noopener">available here</a> (we can either download the document or click on the <em>Raw</em> button in order to cut and paste the content).

First we need to change the three variables at the beginning of the script:
<ul>
 	<li>$rg:  The resource group where we deployed the batch account</li>
 	<li>$batchAccount:  the name of the batch account</li>
 	<li>$storageAccount:  the name of the associated storage account</li>
</ul>
The script performs the following operations:
<ul>
 	<li>Copy <a href="https://github.com/vplauzon/batch/tree/master/PythonBatch/PythonBatchDeploy/Resources" target="_blank" rel="noopener">resources from GitHub</a> to a temporary local folder</li>
 	<li>Packages the resources into 2 zip files</li>
 	<li>Create 2 applications</li>
 	<li>Upload the 2 packages in the applications</li>
 	<li>Set the default version of the applications</li>
 	<li>Clean up the temporary local folder</li>
</ul>
Applications are the way to package content we want to run in a Batch job.

Now we have two applications, which we can see in the application tab of the batch account.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb6.png" alt="image" border="0" /></a>

<em>PythonScript</em> is an application we will schedule to run.  It is a trivial “Hello world” Python application.  <em>PythonSetup</em> is an application we’ll use to setup the nodes where <em>PythonScript</em> are going to run.  It runs an install command on the node (a <em>pip</em> command which installs a Python package).
<h2>Deploying Applications</h2>
Applications are typically deployed with tasks in Azure Batch:  we specify a list of application with a task and the service makes sure the applications are deployed to the node before the task is executed there.

As we’ll see later, we won’t use “normal” tasks.  Those tasks, at the time of this writing (mid December 2017), do not support application deployment, at least not through the Portal interface.  For that reason, we’ll specify the applications need to be deployed to every provisioned node.

Let’s select <em>mainPool</em> again and in the pool pane then select the <em>Application packages</em> tab.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image13.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb13.png" alt="image" border="0" /></a>

From there, let’s select <em>PythonSetup</em> application and version 1.0 then click save.

Let’s repeat for the <em>PythonScript</em> application.

<u>Note</u>:  the best practice would be to <em>Use default version</em> as the application version.  This would deploy the default version.  If we change the default version we wouldn’t need to think about the ripple effect here.  But…  at the time of this writing (mid December 2017), there is a bug in the Portal where this configuration would crash the nodes when they start.  This bug is likely going to be resolved soon.

What this configuration does is to make sure the applications are unpacked (unzipped) and copied on each node provisioned.

Now let’s configure the service to use those applications.
<h2>Start task</h2>
Within the pool, let’s select <em>Start task</em>.  Let’s also select <em>True</em> for <em>Wait for success</em>.  In the <em>Command line</em> text box, let’s write:

<em>/bin/sh -c "$AZ_BATCH_APP_PACKAGE_pythonsetup/setup-python.sh"</em>

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image8.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb8.png" alt="image" border="0" /></a>

As it is stated in the <a href="https://docs.microsoft.com/en-us/azure/batch/batch-compute-node-environment-variables" target="_blank" rel="noopener">online documentation</a>, in order to have access to environment variable, we need to run a shell, hence the <em>/bin/sh</em>.

We access the directory where the application was unzipped within the node using an environment variable.  The <a href="https://docs.microsoft.com/en-us/azure/batch/batch-application-packages#execute-the-installed-applications" target="_blank" rel="noopener">general format of environment variables related to application is described in online documentation</a>.  In our case we do not wish to specify the application version so we point to the default version.

The actual start task doesn’t install anything.  It simply echo something in the shell.

We can now save the start task configuration.
<h2>Scheduling job</h2>
The next step is to schedule jobs.  We’re going to do this by selecting <em>Job schedules</em> tab of the batch account.  We then select the <em>Add</em> button.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb9.png" alt="image" border="0" /></a>

In <em>Job schedule ID</em>, let’s give it a name, e.g. <em>ScheduledScript</em>.

In <em>Schedule</em>, let’s leave defaults, i.e. not start nor end time but let’s select 30 minutes as the <em>Recurrence interval</em>.<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb10.png" alt="image" border="0" /></a>

For <em>Pool</em>, let’s select the main pool.

Under <em>Job manager, preparation and release tasks</em>, we select <em>Custom</em> and we’ll configure the <em>Job manager task</em>.  This task is run once the job is created.  Typically we would create more tasks within that task or manually outside of the job using the Batch SDK.  Here we’ll simplify the job and simply run what we need to run within that task.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb11.png" alt="image" border="0" /></a>

In task ID we’ll type <em>only-task</em>.  In the command line we’ll type:

/bin/sh -c "python $AZ_BATCH_APP_PACKAGE_pythonscript/sample.py"

We can then press <em>Select</em> for the <em>Job Manager</em> and <em>Ok</em> for the <em>Job Schedule</em>.
<h2>Jobs</h2>
The job schedule creates a new job at every recurrence interval (30 minutes in our case).

Each job will schedule a <em>Job Manager</em> task which will eventually kick the auto scaling into creating a node.  This will in turn trigger a <em>start job task</em>.  After completion of this one the <em>Job Manager </em>task will be able to execute.  Eventually the auto scaling will retire the node.

While the executing node is still up we can look at the task execution.  We can look at the job schedule’s jobs and select the latest job.  From there we can look at its tasks:

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb14.png" alt="image" border="0" /></a>

Within the task, we can look at the <em>Files on node</em>, more specifically <em>stdout.txt</em>.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image15.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb15.png" alt="image" border="0" /></a>

This shows what the task running, in our case the Python script, outputted in the console.

<a href="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image16.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2017/12/recurrent-serverless-batch-job-with-azure-batch/image_thumb16.png" alt="image" border="0" /></a>
<h2>Summary</h2>
In this article we showed how we can us Azure Batch to run recurrent batch jobs.

There are a few configurations to get right but the general workflow is quite straightforward:  schedule a recurrent job and set a job manager running whatever we need to run.