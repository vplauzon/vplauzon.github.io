---
title:  Network Access Control on an HDInsight Cluster
date:  01/27/2016 02:19:06
permalink:  "/2016/01/26/network-access-control-on-an-hdinsight-cluster/"
categories:
- Solution
tags:
- Big Data
---
In this post, I’m gona try to show how you can use an Azure Virtual Network with a Network Security Group to control the access (at the network level) to an <a href="http://vincentlauzon.com/2015/09/27/hdinsight-hadoop-hive-setup/">HDInsight</a> cluster.

For a primer on both those technologies, please refer to my <a href="http://vincentlauzon.com/2015/12/21/using-network-security-groups-nsg-to-secure-network-access-to-an-environment/">Using Network Security Groups (NSG) to secure network access to an environment</a> post.

The main caveat I would add is that in that post I was using Resource Manager virtual network (also known as v2) while HD Insight, at the time of this writing (late January 2016) supports only v1, or classic Virtual Network.  Everything else is the same except I won’t be able to ARM template it at the end.

<strong>UPDATE (05-02-2016):  Classic (v1) Virtual Network is required for a Windows Cluster, which is what I do in this article.  For a Linux Cluster, a Resource Manager (v2) Virtual Network is required.  This article remains valid ; you only have to create your Virtual Network with "Resource Manager" option.  See <a href="https://azure.microsoft.com/en-us/documentation/articles/hdinsight-extend-hadoop-virtual-network/" target="_blank">this documentation</a> (that has been updated since I wrote this post) for more details.</strong>
<h2>The problem</h2>
<a href="http://azure.microsoft.com/en-us/services/hdinsight/" target="_blank">Azure HDInsight</a> is basically <a href="http://vincentlauzon.com/2015/09/20/hadoop-ecosystem-overview/">Hadoop cluster</a> as a service.  You can stand up a cluster in minutes and get on with your Big Data jobs.  Better, you can externalize the data so that you can destroy the cluster and stand it up days later and continue with the same data (see <a href="http://vincentlauzon.com/2015/09/27/hdinsight-hadoop-hive-setup/">my post about how to setup HDInsight to externalize data</a>).

Now HDInsight is a public in nature.  So all endpoints on it are open on the internet.  Each endpoint use authentication but for some customers that is not enough.

That is understandable since most companies use Hadoop to analyse business data, sometimes sensitive data.  Therefore having more control on access is mandated.
<h2>Virtual Network</h2>
The obvious way to have more control on Network access is to start by attaching a Virtual Network on your HDInsight cluster.

Let’s first create a Virtual Network.  One of the critical step is to choose the “Classic” Model as opposed to “Resource Manager” Model.

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image17.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb17.png" alt="image" width="513" height="168" border="0" /></a>

Give you v-net a name.  You can leave the address space as the default, i.e. 10.0.0.0/16.  Put it in the same resource group as your HDInsight cluster (for convenience) and in the same region (that’s mandatory).  Then create it.

You now have a Virtual Network you can put an HDInsight cluster in.
<h2>Attaching Virtual Network to cluster</h2>
Now this is required to <strong>be done at the cluster’s creation time</strong>:  you can’t add a virtual Network afterwards (or change its subnet).

So when you create your cluster in the Azure portal, go in the <em>Optional Configuration</em> at the bottom.

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image15.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb15.png" alt="image" width="495" height="119" border="0" /></a>

Then select the Virtual Network box

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image16.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb16.png" alt="image" width="530" height="665" border="0" /></a>

Choose the Virtual Network you just created.  For the subnet, choose the default subnet.

When you’ll create your cluster, it will behave identically to a cluster without a Virtual Network.  The only way to know there is a Virtual Network attached to it is to look at your cluster’s settings

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image18.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb18.png" alt="image" width="655" height="227" border="0" /></a>

and then look at its properties

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image19.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb19.png" alt="image" width="526" height="509" border="0" /></a>

At the bottom of the blade you should see the Virtual Network <em>GUID</em>.

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image20.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb20.png" alt="image" width="511" height="365" border="0" /></a>

A GUID, salt of the Earth!
<h2>VPN Gateway</h2>
Now that you have a Virtual Network you can connect it to your on-promised network and block internet access altogether.

This is probably your most secure option because in many ways it is like the cluster is running on-premise with the benefice of the cloud.

I won’t cover VPN Gateway in this post.
<h2>Network Security Group</h2>
Now the Cluster is in a Virtual Network, we can control access via a Network Security Group.

First, we’ll create a Network Security Group (NSG).

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image21.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb21.png" alt="image" width="964" height="270" border="0" /></a>

which should lead you to

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image22.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb22.png" alt="image" width="620" height="561" border="0" /></a>

Again, make sure you select “Classic” deployment model.

Give it a name and make sure it is in the same resource group and region as your cluster.

Next we’ll attach the newly created NSG to the default subnet of the Virtual Network.  NSGs are independent entities and can be attached to multiple subnets (on potentially multiple Virtual Networks).

Let’s open the virtual network and then open its settings.  From there, open its subnets and select the default one (or whichever you put your cluster in).

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image23.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb23.png" alt="image" width="524" height="653" border="0" /></a>

From there, select <em>Network security group</em> and then select the NSG you just created.

This binds the subnet to the NSG.
<h2>Configuring NSG rules</h2>
At this point your cluster shouldn’t be accessible.  This is because by default, NSGs disable most routes.  To see that, open your NSG and then, in the settings, open the <em>Inbound security rules</em>.

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image24.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb24.png" alt="image" width="1540" height="456" border="0" /></a>

You should have no rules in there.  Click the <em>Default Rules</em> at the top and that should display the default rules.  Basically, the NSG allows connections from within the virtual network, connections from the Azure Load Balancer (this is required so that VMs can be monitored internally) and denies every other routes.

This means, among other things, that the RDP route (or SSH for a Linux cluster) is denied from the internet.

Similarly, if you look at the outbound rules:

<a href="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image25.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="assets/2016/1/network-access-control-on-an-hdinsight-cluster/image_thumb25.png" alt="image" width="1537" height="465" border="0" /></a>

Here, routes toward the virtual network &amp; the internet are allowed but nothing else.

So this is very secure as nothing can get in!  Actually, that would be perfect for the scenario where you connect the Virtual Network to your on premise network (via an Azure VPN Gateway) since then connections from your network would get in.

Now, let’s add a rule to allow traffic coming from your laptop.

First, let’s determine what the IP of your laptop is, by using, for instance, <a title="https://www.whatismyip.com/" href="https://www.whatismyip.com/">https://www.whatismyip.com/</a>.

Then, let’s go back to the inbound rules of your NSG and let’s add a rule:
<ul>
	<li>Name:  Allow laptop</li>
	<li>Priority:  500 (anything between 100 and 64999 really)</li>
	<li>Source:  CIDR block</li>
	<li>Source IP address range:  &lt;the IP of your laptop&gt;/32 (the /32 makes the IP you specify the only enabled IP)</li>
	<li>Protocol:  TCP</li>
	<li>Source Port Range:  *</li>
	<li>Destination:  Any</li>
	<li>Destination Port Range:  *</li>
</ul>
Once the rule has been saved and the NSG updated (it usually takes less than a minute), you should be able to access your cluster (e.g. RDP / SSH, HTTPS to dashboard, etc.).

In practice you would specify a larger IP range corresponding to the outbound IPs of your organization (or department).

Now this will open all the ports of your clusters to the specified IP range.  You would be tempted to enable port by port, but there is some port mapping (for instance for RDP) happening before traffic hits the Virtual Network that forbids that approach to be effective.
<h2>Conclusion</h2>
We’ve seen how to lock down an HDInsight cluster:
<ul>
	<li>Create a Virtual Network</li>
	<li>Associate the Virtual Network to your HDInsight cluster <strong>at creation time</strong></li>
	<li>Create a Network Security Group (NSG)</li>
	<li>Associate the NSG to your cluster subnet</li>
	<li>Add access rule to the inbound rules of the NSG</li>
</ul>
If you tear down your cluster, you can keep the virtual network &amp; associated NSG around.  This way, next time you stand up your cluster, you can simply associate the virtual network and get all the network rules back.