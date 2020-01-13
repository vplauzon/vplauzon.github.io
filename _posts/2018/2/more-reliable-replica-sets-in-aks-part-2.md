---
title: More reliable Replica Sets in AKS - Part 2
date: 2018-05-17 03:30:32 -07:00
permalink: /2018/05/17/more-reliable-replica-sets-in-aks-part-2/
categories:
- Solution
tags:
- Containers
---
<a href="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-2/sheep-2784671_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="sheep-2784671_640" src="/assets/posts/2018/2/more-reliable-replica-sets-in-aks-part-2/sheep-2784671_640_thumb.jpg" alt="sheep-2784671_640" width="320" height="240" align="right" border="0" /></a>In <a href="https://vincentlauzon.com/2018/05/15/more-reliable-replica-sets-in-aks-part-1/">Part 1</a>, we discussed how, by default, replica sets in AKS aren’t highly available.  In this article, we conclude the discussion.  We propose an approach to deploy highly available replica sets.

The objective of this article isn’t to propose a novel way to deploy replica sets in AKS.  We see it as an opportunity to dive into some core concepts.  In this article, for instance, we’ll look at Kubernetes inter-pod affinity / anti-affinity.

Our experiments show replica sets place pods on many fault domains but on one update domain (sometimes).  This is good and means that replica sets, by default, are resilient to hardware failure in Azure.  We also demonstrated that they sometimes land in only one update domain.  This means that a replica set might not be resilient to a <a href="https://docs.microsoft.com/en-ca/azure/virtual-machines/linux/maintenance-and-updates">planned maintenance</a>.

We continue using our 20 nodes AKS cluster.
<h2>Node labels</h2>
Let’s look at the nodes of our cluster.  Let’s run the following command in the shell:

[code language="shell"]

$ kubectl get nodes

NAME                        STATUS    ROLES     AGE       VERSION

aks-nodepool1-37473667-0    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-1    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-10   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-11   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-12   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-13   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-14   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-15   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-16   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-17   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-18   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-19   Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-2    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-3    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-4    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-5    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-6    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-7    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-8    Ready     agent     2d        v1.9.6
aks-nodepool1-37473667-9    Ready     agent     2d        v1.9.6

[/code]

Let’s take one of those nodes and look at its labels.

[code language="shell"]

kubectl describe nodes aks-nodepool1-37473667-0

[/code]

This returns a lot of detail about the node.  If we look at the first lines, we’ll see the labels:

[code language="shell"]

Name:               aks-nodepool1-37473667-0
Roles:              agent
Labels:             agentpool=nodepool1
beta.kubernetes.io/arch=amd64
beta.kubernetes.io/instance-type=Standard_DS1_v2
beta.kubernetes.io/os=linux
failure-domain.beta.kubernetes.io/region=canadacentral
failure-domain.beta.kubernetes.io/zone=1
kubernetes.azure.com/cluster=MC_aks2_aks2_canadacentral
kubernetes.io/hostname=aks-nodepool1-37473667-0
kubernetes.io/role=agent
storageprofile=managed
storagetier=Premium_LRS
Annotations:        node.alpha.kubernetes.io/ttl=0
volumes.kubernetes.io/controller-managed-attach-detach=true
CreationTimestamp:  Tue, 24 Apr 2018 10:53:59 -0400

[/code]

We can see at first glance that Azure surface some information in there.  For instance, the label <em>failure-domain.beta.kubernetes.io/region</em> exposes the Azure region.

An interesting label is <em>failure-domain.beta.kubernetes.io/zone</em>.  Could it be the fault domain of the node?  Let’s find out by listing that label for each node:

[code language="shell"]

$ kubectl get nodes -L failure-domain.beta.kubernetes.io/zone

NAME                        STATUS    ROLES     AGE       VERSION   ZONE
aks-nodepool1-37473667-0    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-1    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-10   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-11   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-12   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-13   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-14   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-15   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-16   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-17   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-18   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-19   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-2    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-3    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-4    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-5    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-6    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-7    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-8    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-9    Ready     agent     2d        v1.9.6    0

[/code]

Comparing that with the Availability Set in the portal we see there is a match.

It is a <a href="https://kubernetes.io/docs/reference/labels-annotations-taints/#failure-domainbetakubernetesiozone">documented behaviour that Kubernetes spread pods across “failure domains”</a>.  Kubernetes “Failure Domains” map to Azure Fault Domains.

We do not see any label matching update domains.
<h2>Hacking alert!</h2>
Our solution relies on us adding an update domain label on each node.

This is a little bit of an hack:  a new node wouldn’t get a label without manual intervention.  Also this requires access to the <a href="https://docs.microsoft.com/en-us/azure/aks/faq#why-are-two-resource-groups-created-with-aks">underlying infrastructure resource group</a>.  At the time of this writing (end of April 2018), AKS is in public preview.  We do have access to the resource group.  This might change in the future as this is “under the hood” information.
<h2>Adding labels</h2>
Adding a label to a node is very easy:  <em>kubectl label nodes &lt;my node&gt; &lt;key&gt;=&lt;value&gt;</em>.

The only challenge here is that there are 20 nodes.  We simply wrote a <a href="https://github.com/vplauzon/containers/blob/master/replicasets-ha/update-domain-label.sh">shell script</a> to do that.

We called the label <em>azure-update-domain</em>.

[code language="shell"]

$ kubectl get nodes -L azure-update-domain

NAME                        STATUS    ROLES     AGE       VERSION   AZURE-UPDATE-DOMAIN
aks-nodepool1-37473667-0    Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-1    Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-10   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-11   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-12   Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-13   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-14   Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-15   Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-16   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-17   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-18   Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-19   Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-2    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-3    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-4    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-5    Ready     agent     2d        v1.9.6    2
aks-nodepool1-37473667-6    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-7    Ready     agent     2d        v1.9.6    0
aks-nodepool1-37473667-8    Ready     agent     2d        v1.9.6    1
aks-nodepool1-37473667-9    Ready     agent     2d        v1.9.6    0

[/code]

<h2>Anti-affinity</h2>
We are going to use a Kubernetes concept called <a href="https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature">Inter-pod affinity and anti-affinity</a>.

Although this is a beta feature, it has been so since version 1.4 of Kubernetes.

According to online documentation:

<em>Inter-pod affinity and anti-affinity allow you to constrain which nodes your pod is eligible to be scheduled based on labels on pods that are already running on the node rather than based on labels on nodes.</em>

This sounds pretty much like what we need.

There two types of pod affinity / anti-affinity:
<ul>
 	<li>preferredDuringSchedulingIgnoredDuringExecution</li>
 	<li>requiredDuringSchedulingIgnoredDuringExecution</li>
</ul>
The “required” type would fail to place a pod if it can’t align with our rules.  The “preferred” type would proceed anyway.

It is tempting for us to use the “required” type.  That would, in general, be a bad idea.  Let’s consider, for instance, an availability set with 3 update domains.  If we deploy a replica set of count 4, then the deployment of the 4th pod would never occur.
<h2>Spec File</h2>
The spec file for a deployment using inter-pod anti-affinity is <a href="https://github.com/vplauzon/containers/blob/master/replicasets-ha/dep-f-with-anti-affinity.yaml">available on GitHub</a>.

[code language="python"]

apiVersion: apps/v1
kind: Deployment
metadata:
  name: webserver-f
  labels:
    app: dep-f
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app-f
  template:
    metadata:
      labels:
        app: app-f
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key:  app
                  operator:  In
                  values:
                  - app-f
              topologyKey: azure-update-domain
      containers:
      - name: myapp
        image: vplauzon/get-started:part2-no-redis
        ports:
        - containerPort: 80
[/code]

Here we state to deploy pods in respect to label <em>failure-domain.beta.kubernetes.io/zone </em>on nodes.  The topology key is the label on the nodes.  We then match the pods to look for with label <em>app=app-f</em>.
<h2>Result</h2>
If we now try the same experiment as we did in the previous article, we can see if this method is efficient.

First, we’ll create the deployment:

[code language="shell"]

kubectl create -f dep-f-with-anti-affinity.yaml

[/code]

(The <a href="https://github.com/vplauzon/containers/blob/master/replicasets-ha/dep-f-with-anti-affinity.yaml">YAML file is on GitHub</a>)

We’ll run the following commands a few times:

[code language="shell"]

kubectl delete rs -l app=app-f

watch kubectl get pods -o wide

[/code]

which gives us the following results:
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th>Trial#</th>
<th>Nodes</th>
<th>Fault Domains</th>
<th>Update Domains</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>{8,19}</td>
<td>{1,0}</td>
<td>{1,0}</td>
</tr>
<tr>
<td>2</td>
<td>{1,2}</td>
<td>{1,0}</td>
<td>{2,1}</td>
</tr>
<tr>
<td>3</td>
<td>{8,18}</td>
<td>{1,0}</td>
<td>{1,2}</td>
</tr>
<tr>
<td>4</td>
<td>{2,15}</td>
<td>{0,1}</td>
<td>{1,2}</td>
</tr>
<tr>
<td>5</td>
<td>{8,18}</td>
<td>{1,0}</td>
<td>{1,2}</td>
</tr>
<tr>
<td>6</td>
<td>{8,19}</td>
<td>{1,0}</td>
<td>{1,0}</td>
</tr>
<tr>
<td>7</td>
<td>{2,15}</td>
<td>{0,1}</td>
<td>{1,2}</td>
</tr>
<tr>
<td>8</td>
<td>{8,13}</td>
<td>{1,0}</td>
<td>{1,0}</td>
</tr>
<tr>
<td>9</td>
<td>{0,2}</td>
<td>{1,0}</td>
<td>{2,1}</td>
</tr>
<tr style="background:lime;">
<td>10</td>
<td>{15,18}</td>
<td>{1,0}</td>
<td><strong>{2,2}</strong></td>
</tr>
<tr style="background:lime;">
<td>11</td>
<td>{2,13}</td>
<td><strong>{0,0}</strong></td>
<td>{1,0}</td>
</tr>
<tr>
<td>12</td>
<td>{8,12}</td>
<td>{1,0}</td>
<td>{1,2}</td>
</tr>
</tbody>
</table>
<h2>Observations</h2>
We notice that, compare to the results from our last article, there isn’t a clear cut cycle going on.  Some nodes gets repeated, but it doesn’t proceed to repeat an entire cycle.  Inter-pod anti-affinity is compute intensive.  So much so that it isn’t recommended to apply it to every deployment.  We suspect the process randomizes the result.

In general, the results are much better than what we have without anti-affinity.  We had 2 over 3 (%66) replica sets landing on only one update domain.  Here we have only one over 12.  This is a great improvement.

Why did we have an exception at trial #10 thought?  We do not know for sure.  We suspect the rule couldn’t evaluate positively.  As its name suggest, the rule is evaluated on scheduling only.  Since we deleted the replica set, that terminated running pods and at the same time schedule new pods.  During a short window when there are 2 pods terminating and 2 pods being created, the rule couldn’t be evaluated successfully.  The engine would have fallen back to scheduling pods on the same update domain.

We might even have been too quick on that trial.  It is possible there were still pods from trial #9 still terminating when we engaged trial #10.  This would have aggravated the problem.

We suspect the same thing must have happened for trial #11 where the pods landed on the same fault domain.
<h2>Recommendations</h2>
Our recommendation at this point (end of April 2018) is twofold:
<ol>
 	<li>If a service is critical, make sure to deploy underlying pods on %65 or more nodes.</li>
 	<li>Aim for running cluster under capacity</li>
</ol>
<h2>Summary</h2>
Anti-affinity improves the placement of pods in a replica set.  It avoids landing the pods in the same update domain.

The placement isn’t perfect as we observed two deviations.  Our explanation is that there were too many pods being terminated.

Maybe a future version of Kubernetes will allow re-evaluation of rule during the execution.  This would alleviate the issue.

The solution we proposed require labelling the nodes with update-domain information.  We do not think this is a viable approach in general since it wouldn’t work when we scale the AKS cluster back and forth.

At this stage, it would be better if the AKS service integrated that concern itself.  At the very least if the update domain would be exposed the method we laid out here would be more viable.