---
title: Custom Logs on AKS & Azure Monitor
date: 2019-01-30 03:30:44 -08:00
permalink: /2019/01/30/custom-logs-on-aks-azure-monitor/
categories:
- Solution
tags:
- Containers
- Operations
---
<img style="float:right;padding-right:20px;" title="From www.pexels.com" src="/assets/posts/2019/1/custom-logs-on-aks-azure-monitor/traceinsnow-e1548692422686.jpg" />

Let's look at a concrete problem:

<ul>
<li>I have containers deployed in <a href="https://vincentlauzon.com/?s=aks">AKS</a></li>
<li>Those container log into custom files</li>
<li>I want to analyse those logs using Azure Monitor (Log Analytics)</li>
</ul>

We'll look at <em>how to do that</em>.

We leverage <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview">Azure Monitor for containers</a>.

<a href="https://docs.microsoft.com/en-us/azure/azure-monitor/platform/data-sources-custom-logs">Custom logs in Log Analytics</a> also is interesting.  That component allows us to collect files on VMs and parse them given a schema.  Unfortunately, to this date (end-of-January 2019), there are no integration between that feature and Azure Monitor for containers.  This makes it harder but not impossible.

As usual, the code used here is <a href="https://github.com/vplauzon/aks/tree/master/custom-logs">available on GitHub</a>.

<h2>Kubernetes' recommendations</h2>

Let's first look at what Kubernetes online documentation has to say.

The <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/">Logging Architecture page</a> gives a few options on how to integrate a logging agent.

By default, Kubernetes considers logs as something coming out of the standard output and standard error of a container.  This is what the documentation refers to as <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#basic-logging-in-kubernetes">basic logging</a>.  Those logs can be consumed with <code>kubectl logs</code>.

One of the documented recommendation is to <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#using-a-node-logging-agent">use an node-agent</a>.  This is what <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview">Azure Monitor for containers</a> does:  it deploys an agent on each node with a Daemon set:

```bash
$ kubectl get ds --all-namespaces=true
NAMESPACE     NAME                DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
kube-system   kube-proxy          3         3         3       3            3           beta.kubernetes.io/os=linux   4h
kube-system   kube-svc-redirect   3         3         3       3            3           beta.kubernetes.io/os=linux   4h
kube-system   omsagent            3         3         3       3            3           beta.kubernetes.io/os=linux   4h
```

We see the <em>omsagent</em> as the last daemon set.

Azure Monitor for containers will gather different Kubernetes metrics and will gather container basic logs, i.e. stdout / stderr.

This doesn't help us directly with custom files.

Another approach suggested by Kubernetes documentation is to <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#using-a-sidecar-container-with-the-logging-agent">use a sidecar container to expose the logs</a>.  Basically, the sidecar reads the files and output them in its standard output.  The logs can then be read by a node agent.

Another approach is to <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#sidecar-container-with-a-logging-agent">deploy a container agent in a sidecar container</a>.  Unfortunately, to this date (end of January 2019), Azure Monitor doesn't support this scenario.

Finally, the last approach is to have the <a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#exposing-logs-directly-from-the-application">application push the logs to the logging back end</a>.  Although this is supported via Azure Monitor API, it is the most difficult to implement.  We won't cover it here.

<h2>Using Azure Monitor / Log Analytics</h2>

Now let's look at how to implement those suggestions using Azure Monitor / Log Analytics.

We'll go from the easiest to the hardest scenario to implement.

All those examples are based on a cluster where the <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview#how-do-i-access-this-feature">monitoring add on has been activated</a>.

<h3>Ingesting standard output</h3>

The simplest case is where the logs are outputted to the standard output.

Let's deploy a <a href="https://github.com/vplauzon/aks/blob/master/custom-logs/standard-output.yaml">pod that does just that</a>:

```text
apiVersion: v1
kind: Pod
metadata:
  name: standard-output-pod
spec:
  containers:
  - name: main-container
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date) dog";
        i=$((i+1));
        sleep 1;
      done
```

We can check the logs it produces:

```bash
$ kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/custom-logs/standard-output.yaml
$ kubectl get pods
NAME                  READY   STATUS    RESTARTS   AGE
standard-output-pod   1/1     Running   0          22m

$ kubectl logs standard-output-pod
0: Mon Jan 28 20:54:47 UTC 2019 dog
1: Mon Jan 28 20:54:48 UTC 2019 dog
2: Mon Jan 28 20:54:49 UTC 2019 dog
3: Mon Jan 28 20:54:50 UTC 2019 dog
...
```

If we give a few minutes for Azure Monitor to gather the logs, we can use the following query:

<img src="/assets/posts/2019/1/custom-logs-on-aks-azure-monitor/stdout-log.png" alt="Log query" />

Hence this solution fits nicely with Azure monitor for Containers.

<h2>Ingesting a single file via a sidecar</h2>

Now, let's consider a scenario where we have a container logging to a single file.

As suggested in 
<a href="https://kubernetes.io/docs/concepts/cluster-administration/logging/#using-a-sidecar-container-with-the-logging-agent">Kubernetes documentation</a>, we can use a sidecar container to expose the logs.

Let's simulate it <a href="https://github.com/vplauzon/aks/blob/master/custom-logs/single-file-to-output.yaml">this way</a>:

```text
apiVersion: v1
kind: Pod
metadata:
  name: single-file-to-output-pod
spec:
  containers:
  - name: main-container
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date) dog" >> /var/log/mylogs/log.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: logs
      mountPath: /var/log/mylogs
  - name:  log-display
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/mylogs/log.log']
    volumeMounts:
    - name: logs
      mountPath: /var/log/mylogs
  volumes:
  - name: logs
    emptyDir: {}
```

Here we have a multi-container pod.  The two pods share a mounted volume of type <a href="https://kubernetes.io/docs/concepts/storage/volumes/#emptydir">emptyDir</a>.  That volume is bound to the pod and gets deleted with it.

The first container writes in a file while the second one display (using <em>tail</em>) that file.

```bash
$ kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/custom-logs/single-file-to-output.yaml
$ kubectl logs single-file-to-output-pod log-display
0: Mon Jan 28 22:21:45 UTC 2019 dog
1: Mon Jan 28 22:21:46 UTC 2019 dog
2: Mon Jan 28 22:21:47 UTC 2019 dog
...
```

Similarly, those logs get ingested by Azure Monitor for Containers.

<h2>Ingesting multiple files via a sidecar</h2>

Now, rarely does an application logs on the same file forever.  Typically, applications log on a file for a while (e.g. an hour) before creating a new file.

We can use the same method than in the previous section and simulate it this way:

```text
apiVersion: v1
kind: Pod
metadata:
  name: multiple-file-to-output-pod
spec:
  containers:
  - name: main-container
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date) dog" >> /var/log/mylogs/1.log;
        echo "$i: $(date) cat" >> /var/log/mylogs/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: logs
      mountPath: /var/log/mylogs
  - name:  log-display
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/mylogs/*.log']
    volumeMounts:
    - name: logs
      mountPath: /var/log/mylogs
  volumes:
  - name: logs
    emptyDir: {}
```

Here we write to 2 files all the time.

We can test it:

```bash
$ kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/custom-logs/multiple-file-to-output.yaml
$ kubectl logs multiple-file-to-output-pod log-display
==> /var/log/mylogs/1.log <==
0: Mon Jan 28 22:53:00 UTC 2019 dog

==> /var/log/mylogs/2.log <==
0: Mon Jan 28 22:53:00 UTC 2019 cat

==> /var/log/mylogs/1.log <==
1: Mon Jan 28 22:53:01 UTC 2019 dog

==> /var/log/mylogs/2.log <==
1: Mon Jan 28 22:53:01 UTC 2019 cat
...
```

Again, this will be ingested by Azure Monitor for containers.

On first level it might seem that there is a lot of noise in those logs since we keep switching files.  The pattern is more likely to be that a single file is going to be appended to for an hour before a new file takes over.  So, there would be very little of this "==&gt;" noise.

This noise could be filtered by piping the output into a shell command filtering.  It could also be filtered against in queries.

<h2>Ingesting multiple files on the host</h2>

Another angle to this problem is to use <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/platform/data-sources-custom-logs">Custom logs in Log Analytics</a>.  This is typically used for gathering log files on VMs.

What we can do is to mount an <a href="https://kubernetes.io/docs/concepts/storage/volumes/#hostpath">hostPath</a> volume on our main container.  A host path volume is a path on the host of the pod.  So basically, we would log directly on the host running the pod and then have the agent running on the node gathering those files.

This does work but we do not recommend this approach for multiple reasons:

<ol>
<li>Logging directly on the host could eventually saturate the host file system.  We could paliate to that by using <a href="https://linux.die.net/man/8/logrotate">logrotate</a> in a daemon set ; but that adds considerable complexity.</li>
<li>By default, the monitoring addon on AKS doesn't enlist log ingestion on the host, only on the platform (e.g. Kubernetes metrics) and containers.  We need to manually enlist the hosts in a Log Analytics workspace or rely on the "default workspace" enforced by Azure Security Center.</li>
<li>If we apply that to muliple solutions, we would need a different host-folder for each solution in order for them not to clash.  This means we would replicate the pod-model on the host which is a little awkward.</li>
</ol>

For both those reasons, that solution is more complex.  There could also be complex edge cases.  For instance, if 2 pods get schedule on the same node, would they start writing on the same files on the host?

In general, we advise against touching the hosts.

Nevertheless, if we want to do it, we could simulate it <a href="https://github.com/vplauzon/aks/blob/master/custom-logs/multiple-file-to-host.yaml">like this</a>:

```text
apiVersion: v1
kind: Pod
metadata:
  name: multiple-file-to-host-pod
spec:
  containers:
  - name: main-container
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date) dog" >> /var/log/mylogs/1.log;
        echo "$i: $(date) cat" >> /var/log/mylogs/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: logs
      mountPath: /var/log/mylogs
  volumes:
  - name: logs
    hostPath:
      # directory location on host
      path: /var/log/my-app-logs
      type: Directory
```

We would then follow the <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/platform/data-sources-custom-logs#defining-a-custom-log">custom logs procedure</a>.

<h2>Summary</h2>

We showed different way to ingest custom logs from AKS to Azure Monitor.

The easiest path is to leverage Azure Monitor for Containers.  This requires us to output the logs to the standard output of a container somehow.  Typically, we use a side car container to display the files written by another container.

We also discussed of using custom logs ingestion on the host.  We do not encourage using that solution.