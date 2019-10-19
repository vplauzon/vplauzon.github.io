---
title:  Dynamic disks in AKS
date:  2019-01-15 06:30:27 -05:00
permalink:  "/2019/01/15/dynamic-disks-in-aks/"
categories:
- Solution
tags:
- Containers
---
<img style="float:right;padding-right:20px;" title="From www.pexels.com" src="/assets/2019/1/dynamic-disks-in-aks/data-disk-floppy-41290-e1547476772722.jpg" />

Some workloads running on <a href="https://vincentlauzon.com/?s=aks">Azure Kubernetes Service</a> (AKS) requires persisting state on disk.

In general, I recommend to use external PaaS services, i.e. Azure Blob Storage, Azure SQL DB, Azure Cosmos DB, etc.  .  Those services take care of the stateful nature of the service, manages HA, backups, geo-replication, etc.  .

Persisting state on disks in AKS comes with none of PaaS benefit.  It is like running IaaS:  we need to manage backups, high availability &amp; geo replication.  Those aren't trivial to manage.

In the few cases where I need to persist on a disk, I use <a href="https://kubernetes.io/docs/concepts/storage/volumes/">Kubernetes Volume</a>.  This is a K8s abstraction where we mount a volume in a pod, but the volume can be defined in different ways.  Azure specifics are:

<ul>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv">Azure Disk Dynamic</a> (disks are created on the fly)</li>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-disk-volume">Azure Disk Static</a> (we point to a pre-defined disk)</li>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-files-dynamic-pv">Azure File Dynamic</a></li>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-files-volume">Azure File Static</a></li>
</ul>

Typically, I see teams using Azure Disk Dynamic to have performant storage own by a pod and Azure File Static for storage shared across many pods with less performance.  Don't run a database on Azure File, even Premium.

In this article we'll cover disks.  The online documentation is a little misleading as the example given there doesn't scale to a multi-pod deployment.  We'll see how to do that.

As usual, the code is on <a href="https://github.com/vplauzon/aks/tree/master/dynamic-disks">GitHub</a>.

<h2>Deployment with Persistent Volume Claim</h2>

The online documentation of <a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv">Azure Disk Dynamic</a> does a great job of explaining the different concepts at play here:

<ul>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv#built-in-storage-classes">Storage class</a></li>
<li><a href="https://docs.microsoft.com/en-us/azure/aks/azure-disks-dynamic-pv#create-a-persistent-volume-claim">Persistent Volume Claim</a> (PVC)</li>
<li>How to create volumes from a PVC</li>
</ul>

So, let's go with <a href="https://github.com/vplauzon/aks/blob/master/dynamic-disks/dynamic-with-deploy.yaml">an example</a>:

```bash
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: azure-managed-disk
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: managed-premium
  resources:
    requests:
      storage: 25Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: disk-deploy
  labels:
    app: busy-box-with-disk
spec:
  replicas: 1
  selector:
    matchLabels:
      app: disk-pod
  template:
    metadata:
      labels:
        app: disk-pod
    spec:
      containers:
      - name:  busy
        image: vplauzon/get-started:part2-no-redis
        ports:
        - containerPort: 80
        volumeMounts:
        - name: volume
          mountPath: /buffer
      volumes:
      - name: volume
        persistentVolumeClaim:
          claimName: azure-managed-disk
```

This YAML file has two resources:  a <em>PersistentVolumeClaim</em> and a <em>Deployment</em>.  The former defines a claim for a 25Gb disk of Premium Managed Disk.  The latter deploy a pod with 1 replica mounting a volume using the claim.

We can deploy that file using:

```bash
kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/dynamic-disks/dynamic-with-deploy.yaml
```

If we look, in the managed resource group, we can see this create a new disk:

<img src="/assets/2019/1/dynamic-disks-in-aks/1-disk.png" alt="One more disk" />

Our cluster has 3 nodes.  One more was added.  Let's open the disk:

<img src="/assets/2019/1/dynamic-disks-in-aks/first-disk.png" alt="Disk summary" />

We can see the disk is attached to an agent pool VM.  Basically, the disk got attached to the VM running the pod.

We can also look at the tags:

<img src="/assets/2019/1/dynamic-disks-in-aks/1-tags.png" alt="Tags" />

We see they correspond to Persistent Volume Claim we defined.  As for the persistent volume (PV) created from that claim, we can query for it:

```bash
$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS        CLAIM                                                STORAGECLASS      REASON   AGE
pvc-d53e41ee-1810-11e9-bea0-0a58ac1f072d   25Gi       RWO            Delete           Bound         default/azure-managed-disk                           managed-premium            18m
```

Now, let's look at the pods:

```bash
$ kubectl get pods
NAME                         READY   STATUS    RESTARTS   AGE
disk-deploy-6dfbb5cc-79bqx   1/1     Running   0          1m
```

We see that, as usual, the deployment created a pod with a unique name.

<h2>Scaling to multi-pods</h2>

We successfully attached a disk on a pod via a deployment.

Let's scale that deployment to 4 pods:

```bash
kubectl patch deploy disk-deploy -p '{"spec":{"replicas":4}}'
```

We quickly see there is a problem here.  First only one pod starts:

```bash
$ kubectl get pods -o wide
NAME                         READY   STATUS              RESTARTS   AGE   IP            NODE                       NOMINATED NODE
disk-deploy-6dfbb5cc-79bqx   1/1     Running             0          37m   10.244.2.11   aks-agentpool-22115152-2   <none>
disk-deploy-6dfbb5cc-pl9wm   0/1     ContainerCreating   0          23m   <none>        aks-agentpool-22115152-0   <none>
disk-deploy-6dfbb5cc-q89jb   1/1     Running             0          23m   10.244.2.12   aks-agentpool-22115152-2   <none>
disk-deploy-6dfbb5cc-rkmf5   0/1     ContainerCreating   0          23m   <none>        aks-agentpool-22115152-0   <none>
```

Important observation:  only the pod on the same node as the original pod could start.

If we look in the portal, we do not see new disks getting created.  Let's look at a failing pod:

```bash
$ kubectl describe pod disk-deploy-6dfbb5cc-pl9wm
...
Events:
  Type     Reason              Age                From                               Message
  ----     ------              ----               ----                               -------
  Normal   Scheduled           19m                default-scheduler                  Successfully assigned default/disk-deploy-6dfbb5cc-pl9wm to aks-agentpool-22115152-0
  Warning  FailedAttachVolume  19m                attachdetach-controller            Multi-Attach error for volume "pvc-d53e41ee-1810-11e9-bea0-0a58ac1f072d" Volume is already used by pod(s) disk-deploy-6dfbb5cc-79bqx
  Warning  FailedMount         89s (x8 over 17m)  kubelet, aks-agentpool-22115152-0  Unable to mount volumes for pod "disk-deploy-6dfbb5cc-pl9wm_default(41c47e32-1816-11e9-bea0-0a58ac1f072d)": timeout expired waiting for volumes to attach or mount for pod "default"/"disk-deploy-6dfbb5cc-pl9wm". list of unmounted volumes=[volume]. list of unattached volumes=[volume default-token-gljst]
```

We see the volume failed to attach.

The reason for that is that Kubernetes has the same Persistent Volume (PV) used by each pod.

It isn't possible for Azure Disk to be shared between VMs.  Therefore, as long as pods reside on the same node than the original pod where the disk was attached, it works.

This Kubernetes mechanism clearly fails for scenarios where we want independent volumes.

<h2>Enter stateful sets</h2>

What we used so far was <a href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/">Kubernetes Deployments</a> which leverages <a href="https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/">Kubernetes Replica Sets</a>.

To achieve our scenario, we need <a href="https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/">Kubernetes Stateful sets</a>. Stateful sets guarantee ordering and uniqueness of Pods.  Pods identity survive the pod, i.e. a given pod, upon failure would be recreated with the same identity (sticky identity).

A stateful set also manages volumes differently.  They are assigned in a deterministic fashion with a claim per pod.

Let's create <a href="https://github.com/vplauzon/aks/blob/master/dynamic-disks/dynamic-with-stateful.yaml">something similar</a> as last example but using a stateful set:

```bash
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: disk-stateful-set
  labels:
    app: busy-box-with-stateful-set-disk
spec:
  replicas: 5
  selector:
    matchLabels:
      app: stateful-disk-pod
  serviceName:  stateful-disk-set
  template:
    metadata:
      labels:
        app: stateful-disk-pod
    spec:
      containers:
      - name:  busy
        image: vplauzon/get-started:part2-no-redis
        ports:
        - containerPort: 80
        volumeMounts:
        - name: azure-managed-disk-stateful
          mountPath: /buffer
  volumeClaimTemplates:
  - metadata:
      name: azure-managed-disk-stateful
    spec:
      storageClassName: managed-premium
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 25Gi
```

Let's deploy that stateful set:

```bash
$ kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/dynamic-disks/dynamic-with-stateful.yaml
```

Now if we look at the pods getting created:

```bash
$ kubectl get pods
NAME                         READY   STATUS              RESTARTS   AGE
disk-deploy-6dfbb5cc-79bqx   1/1     Running             0          2h
disk-deploy-6dfbb5cc-pl9wm   0/1     ContainerCreating   0          2h
disk-deploy-6dfbb5cc-q89jb   1/1     Running             0          2h
disk-deploy-6dfbb5cc-rkmf5   0/1     ContainerCreating   0          2h
disk-stateful-set-0          0/1     ContainerCreating   0          1m
```

We notice two things:

<ol>
<li>The pods' names are deterministic:  <em>disk-stateful-set-0</em> is the name of the stateful set plus an index (0, 1, ...)</li>
<li>The pods are brought online in sequence, not in parallel as with a deployment</li>
</ol>

With time we can see that Azure disks get created and bound to pods.

```bash
$ kubectl get pods
NAME                         READY   STATUS              RESTARTS   AGE
disk-deploy-6dfbb5cc-79bqx   1/1     Running             0          3h
disk-deploy-6dfbb5cc-pl9wm   0/1     ContainerCreating   0          3h
disk-deploy-6dfbb5cc-q89jb   1/1     Running             0          3h
disk-deploy-6dfbb5cc-rkmf5   0/1     ContainerCreating   0          3h
disk-stateful-set-0          1/1     Running             0          3m
disk-stateful-set-1          1/1     Running             0          2m
disk-stateful-set-2          1/1     Running             0          2m
disk-stateful-set-3          1/1     Running             0          1m
disk-stateful-set-4          1/1     Running             0          51s
```

Now, if we delete a pod to simulate a failure, the pod will be rescheduled with the same name and the same disk.

<h2>Limitations of Stateful sets</h2>

<a href="https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#limitations">Kubernetes online documentation</a> lists some limitations of stateful sets.

On top of those we would like to stretch out that a stateful set isn't a magic bullet for stateful workloads.

It basically implements the equivalent of having multiple instances of a workload, each with its own disk.  Failure of pods do not impact that picture.

It doesn't implement any stateful smarts though.  For instance, it doesn't implement a master / slave configuration typical for databases.

Stateful workloads typically get those more advanced features by implementing a <a href="https://coreos.com/operators/">Kubernetes Operator</a>.  An operator defines custom resources with their custom controllers which can then, in turn, implement specific logic.

<h2>Summary</h2>

We've seen how we can use Azure Disk as persistent volumes in AKS.

For non-trivial scenarios, i.e. multi-pods, we turned to stateful sets.