---
title:  Requests vs Limits in Kubernetes
date:  2019-04-02 06:30:14 -04:00
permalink:  "/2019/04/02/requests-vs-limits-in-kubernetes/"
categories:
- Solution
tags:
- Containers
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="/assets/2019/4/requests-vs-limits-in-kubernetes/bark-chopped-circle-207296.jpg" />

Kubernetes doesn't know what resources (i.e. CPU &amp; memory) your container needs.  That is why you must give it some hints.

If you run way under capacity and / or fairly similar pods, you do not need to do that.  But if you start approaching the maximum capacity of your cluster or if you have pods that consume more resources than others, you'll start to get in trouble.

In this article we will look at how to inform Kubernetes about pods' resources and how we can optimize for different scenarios.

A scenario that typically comes up is when a cluster has a bunch of pods where a lot of them are dormant, i.e. they don't consume CPU or memory.  Do we have to carve them a space they won't use most of the time?  The answer is no.  As usual, it's safer to provision capacity for a workload than relying on optimistic heuristic that not all workloads will require resources at the same time.  So, we can configure Kubernetes optimistically or pessimistically.

We'll review Kubernetes specs first.  Then, as <a href="https://vincentlauzon.com/2019/03/26/testing-outbound-connections-in-aks-kubenet-and-aci/">we did recently with outbound traffic</a>, we'll simply experiment to find answers.

As usual the <a href="https://github.com/vplauzon/aks/tree/master/requests-vs-limits">code is in GitHub</a>.

<h2>Managing compute resources</h2>

<a href="https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container">Kubernetes online documentation</a> explains how to configure resources.

Here are some highlights.

There are two resources types:  CPU &amp; memory.  The former is quantified in number of cores while the latter is quantified in bits of RAM.

Resources are configured at the container level, not pod level.  But since a pod is a deployment unit, the total resources required by the containers of a pod is what we focus on.

There are two ways to specify resources:  requests &amp; limits.  This is where a lot of confusion arises.  Let's try to clarify it here.  Each one (i.e. requests and limits) can be specified with CPU and / or memory.  Here are key characteristics:

<table>
<thead>
<tr>
  <th>Specify</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Requests</td>
  <td>The <em>requests</em> specification is used at pod placement time:  Kubernetes will look for a node that has both enough CPU and memory according to the <em>requests</em> configuration.</td>
</tr>
<tr>
  <td>Limits</td>
  <td>This is enforced at runtime.  If a container exceeds the <em>limits</em>, Kubernetes will try to stop it.  For CPU, it will simply curb the usage so a container typically can't exceed its limit capacity ; it won't be killed, just won't be able to use more CPU.  If a container exceeds its memory <em>limits</em>, it could be terminated.</td>
</tr>
</tbody>
</table>

It's tempting to see those two as minimum / maximum, but it isn't really.  <em>Requests</em> is only used for placement and creates a theoretical map of the cluster.  Kubernetes makes sure that the sum of <em>requested</em> resources for a node is equal or less the capacity of the node.  It isn't a minimum.  Our container could actually use less.  It's a hint at what it needs.

The <em>limits</em> are closer to the concept of maximum

<h2>Pessimistic vs Optimistic</h2>

So how should we use those configurations?

If we are pessimistic, we'll want to make sure our containers have enough resource at all time.  So, we'll the requests for what the containers need to run at all time.  We'll set the limits just to prevent bad behaviours.

If we are optimistic, we'll want to make sure our containers have enough resource to start but will rely of "over capacity" to peak.  That over capacity will be coming from the resources other containers happen not to be using at that time.

<table>
<thead>
<tr>
  <th></th>
  <th>Pessimistic</th>
  <th>Optimistic</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Requests</td>
  <td>What container needs to run at all time</td>
  <td>What container needs to start and when idle</td>
</tr>
<tr>
  <td>Limits</td>
  <td>Prevent bad behaviour, i.e. noisy neighbour:  what the container should never need</td>
  <td>Also to prevent bad behaviour.  Moreover, to ensure there will be over capacity by containing the runtime of each individual containers</td>
</tr>
</tbody>
</table>

Of course, there are degrees of optimisms.  The lower we push the <em>requests</em>, the more we rely on the ethereal "over capacity".  The higher we push it, the more we provision capacity.

<h2>Setup experiences</h2>

Let's experiment using Azure Kubernetes Service (AKS).

In order to run those experiments, we'll need the Azure CLI tool connected to an Azure subscription.

First, let's download an <a href="https://github.com/vplauzon/aks/blob/master/requests-vs-limits/deploy.json">ARM template</a> and <a href="https://github.com/vplauzon/aks/blob/master/requests-vs-limits/create-cluster.sh">a script</a> invoking it:

```bash
curl https://raw.githubusercontent.com/vplauzon/aks/master/requests-vs-limits/deploy.json > deploy.json
curl https://raw.githubusercontent.com/vplauzon/aks/master/requests-vs-limits/create-cluster.sh > create-cluster.sh
```

Let's make the script executable:

```bash
chmod +x create-cluster.sh
```

We are going to run that script with five parameters:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Name of the resource group</td>
  <td>If the group doesn't exist, the script will create it</td>
</tr>
<tr>
  <td>Azure region</td>
  <td>Must be compatible with regions supporting ACI in VNET.  At the time of this writing, i.e. end-of-March 2019, that means one of the following:  EastUS2EUAP, CentralUSEUAP, WestUS, WestCentralUS, NorthEurope, WestEurope, EastUS or AustraliaEast.</td>
</tr>
<tr>
  <td>Name of workspace</td>
  <td>This needs to be unique</td>
</tr>
<tr>
  <td>Name of cluster</td>
  <td>This is also used as the DNS prefix for the cluster, hence must be unique</td>
</tr>
<tr>
  <td>Service Principal Application ID</td>
  <td>Application ID of a Service Principal</td>
</tr>
<tr>
  <td>Service Principal Object ID</td>
  <td>Object ID of the same Service Principal</td>
</tr>
<tr>
  <td>Service Principal Password</td>
  <td>Password of the same Service Principal</td>
</tr>
</tbody>
</table>

We are using Log Analytics to monitor the CPU / memory usage of containers.

The last three parameters are related to the Service Principal that will be used by AKS.

Let's run the command locally, e.g.:

```bash
./create-cluster.sh aks-group eastus myuniquelaworkspace myuniqueaks \
    <my-principal-app-id> \
    <my-principal-object-id> \
    <my-principal-password>
```

This takes a few minutes to execute.

<h2>Exceeding CPU requests</h2>

Now that we have a cluster, let's deploy <a href="https://github.com/vplauzon/aks/blob/master/requests-vs-limits/service.yaml">something on it</a>:

```Javascript
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpu-ram-api
spec:
  replicas: 6
  selector:
    matchLabels:
      app:  cpu-ram-api
  template:
    metadata:
      labels:
        app: cpu-ram-api
    spec:
      containers:
      - name: myapp
        image: vplauzon/cpu-ram-request-api:4
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64M"
            cpu: "250m"
          limits:
            memory: "128M"
            cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
  selector:
    app: cpu-ram-api
```

We have a deployment and a public service load balancing the pods of the deployment.

The pod has one container.  Container's image is <a href="https://hub.docker.com/r/vplauzon/cpu-ram-request-api">vplauzon/cpu-ram-request-api</a>.  The <a href="https://github.com/vplauzon/aks/tree/master/requests-vs-limits/CpuRamRequestSolution">source code of this container also is on GitHub</a>.  It's an API implemented in C#.  It basically keeps the CPU busy and allocate memory.  This was built on purpose for these tests.

We see under the subsection <em>resources</em> that we specify a request of 64 Mb of RAM and 250 "mili core" or 1/4 of a core.  Similarly, we specify a limit of 128 Mb and 2 cores.

Let's deploy it:

```bash
kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/requests-vs-limits/service.yaml
```

Let's look at the pods:

```bash
$ kubectl get pods

NAME                           READY   STATUS    RESTARTS   AGE
cpu-ram-api-76cb6dbbff-926nk   1/1     Running   0          84s
cpu-ram-api-76cb6dbbff-gvp4t   1/1     Running   0          84s
cpu-ram-api-76cb6dbbff-sfjc4   1/1     Running   0          84s
cpu-ram-api-76cb6dbbff-wn7rr   1/1     Running   0          84s
cpu-ram-api-76cb6dbbff-wrpwv   0/1     Pending   0          84s
cpu-ram-api-76cb6dbbff-zh5q8   1/1     Running   0          84s
```

We see that one of the pods is pending.  Our cluster has a single node.  The VM sku (B2ms) has 2 cores and 8 Gb of RAM.  Kubernetes uses a portion of those resources.  We do not have access to all resources of the VM for our pods.  With 5 pods active, we requested 1.25 cores.  There weren't enough resources for 1.5.

Now let's look at the service:

```bash
$ kubectl get svc

NAME          TYPE           CLUSTER-IP    EXTERNAL-IP      PORT(S)        AGE
kubernetes    ClusterIP      10.0.0.1      <none>           443/TCP        175m
web-service   LoadBalancer   10.0.183.39   52.232.248.115   80:31146/TCP   11m
```

We need to copy the external IP of the <em>web-service</em> service.  That's the Azure public IP associated to the load balancer of that service.  Let's store that in a shell variable:

```bash
ip=52.232.248.115  # Here, let's replace that specific IP with the one from our cluster
```

Now let's try a few things:

```bash
$ curl "http://$ip/"

{"duration":1,"numberOfCore":1,"ram":10,"realDuration":"00:00:01.0021172"}
```

By default, the API will allocate 10 Mb of RAM, use one core to do some work and run for one second.

Let's see if we can find that usage.  Let's open the AKS cluster in the portal and let's look at the Metrics, under Monitoring:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/insights.png" alt="Metrics" />

Now we are going to maximize the view (little chevrons on both sides), select the <em>containers</em> tab, search for <em>myapp</em> and display <em>CPU</em> with <em>Max</em>:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/empty-insights.png" alt="Empty insights" />

We do not see a blip on the radar.  So, let's run that for a little longer.  We can do that with specific query strings:

```bash
$ curl "http://$ip/?duration=90"

{"duration":90,"numberOfCore":1,"ram":10,"realDuration":"00:01:30.0804972"}
```

This will take 90 seconds to run.

We'll need to wait a little for Log Analytics to catch up on the metrics.  But then:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/90s.png" alt="90 seconds" />

We switched to "The last 30 minutes" in <em>Time range</em>.

We see that most of one core (895 mili core) was used.

Here we just proved that a container can consumed more than its "requests" specs which was 0.25 core.

Let's do the same thing with 2 cores:

```bash
$ curl "http://$ip/?duration=90&core=2"

{"duration":90,"numberOfCore":2,"ram":10,"realDuration":"00:01:30.0031934"}
```

we can see here:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/90s-2cores.png" alt="90 seconds &amp; 2 cores" />

The usage went close to 2 cores and is highlighted in red, since it's close to its limits.

Here the container went to the maximum of its limit.

We won't do it here, but if we set the limit to 1 core, the same experience would yield the result that only one core would be used.  Kubernetes enforces the limit.

Let's try to run many of those at the same time:

```bash
curl "http://$ip/?duration=90&core=2" &
curl "http://$ip/?duration=90&core=2" &
curl "http://$ip/?duration=90&core=2" &
```

Here we can see that each container takes less than one core:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/multiple-2cores.png" alt="Multiple 2 cores" />

Basically, they all pull on the blanket but none of the containers can fully used two cores.

This is the flip side of under provisioning:  if all pods peak at the same time, they won't all get the "over capacity".

<h2>Exceeding Memory requests</h2>

Now let's try to crank the memory used:

```bash
curl "http://$ip/?duration=5&ram=20"
```

Here we request to use 20Mb within the request.  That adds up to the rest of the memory used by the container:

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/20mb.png" alt="20 Mb" />

We then get close to our 128 Mb limit.  Let exceed it:

```bash
$ curl "http://$ip/?duration=5&ram=100"

curl: (52) Empty reply from server
```

We see an error occurs.  That's because the container got killed when its memory demand occurred and the total memory exceeded the container's limit specification.

<img src="/assets/2019/4/requests-vs-limits-in-kubernetes/deleted-container-1.png" alt="Deleted Container" />

We can see from the logs the container was restarted since the memory went down.  The pod didn't get replaced, only the container.

<h2>Summary</h2>

We've looked at how we can specify resources allocated for containers.  We've looked at a few examples.

What sums it the best is this matrix:

<table>
<thead>
<tr>
  <th></th>
  <th>Pessimistic</th>
  <th>Optimistic</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Requests</td>
  <td>What container needs to run at all time</td>
  <td>What container needs to start and when idle</td>
</tr>
<tr>
  <td>Limits</td>
  <td>Prevent bad behaviour, i.e. noisy neighbour:  what the container should never need</td>
  <td>Also to prevent bad behaviour.  Moreover, to ensure there will be over capacity by containing the runtime of each individual containers</td>
</tr>
</tbody>
</table>

As part of our deployment strategy with Kubernetes, we need to think if we want to be pessimistic or optimistic.

If we are pessimistic, we'll always have enough resources, but the amount of resources will be higher.  And with resources in the cloud, the cost is higher.

If we are optimistic, it will be cheaper, but we might run out of capacity sometimes.

Kubernetes gives us the flexibility to make that decision ourselves.