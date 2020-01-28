---
title: Taking a snapshot of a Managed Disk
date: 2017-02-22 08:00:56 -08:00
permalink: /2017/02/22/taking-a-snapshot-of-a-managed-disk/
categories:
- Solution
tags:
- Virtual Machines
---
We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s snapshot a Managed Disk and restore the snapshot on another VM.
<h3>Deploy ARM Template</h3>

```JavaScript

{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "VM Admin User Name": {
      "defaultValue": "myadmin",
      "type": "string"
    },
    "VM Admin Password": {
      "defaultValue": null,
      "type": "securestring"
    },
    "VM Size": {
      "defaultValue": "Standard_DS4",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3",
        "Standard_DS4",
        "Standard_DS5"
      ],
      "metadata": {
        "description": "SKU of the VM."
      }
    },
    "Public Domain Label": {
      "type": "string"
    }
  },
  "variables": {
    "Vhds Container Name": "vhds",
    "frontIpRange": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Front Address Pool Name": "frontPool",
    "Front NIC": "frontNic",
    "Front VM": "Demo-VM",
    "Front Availability Set Name": "frontAvailSet",
    "Private LB Name": "PrivateLB",
    "VNET Name": "Demo-VNet"
  },
  "resources": [
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "name": "[variables('Public IP Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public IP"
      },
      "properties": {
        "publicIPAllocationMethod": "Dynamic",
        "idleTimeoutInMinutes": 4,
        "dnsSettings": {
          "domainNameLabel": "[parameters('Public Domain Label')]"
        }
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "name": "[variables('VNet Name')]",
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "10.0.0.0/16"
          ]
        },
        "subnets": [
          {
            "name": "front",
            "properties": {
              "addressPrefix": "[variables('frontIpRange')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
      ]
    },
    {
      "type": "Microsoft.Network/loadBalancers",
      "name": "[variables('Public LB Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public Load Balancer"
      },
      "properties": {
        "frontendIPConfigurations": [
          {
            "name": "LoadBalancerFrontEnd",
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Front Address Pool Name')]"
          }
        ],
        "loadBalancingRules": [
          {
            "name": "Http",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 80,
              "backendPort": 80,
              "enableFloatingIP": false,
              "idleTimeoutInMinutes": 4,
              "protocol": "Tcp",
              "loadDistribution": "Default",
              "backendAddressPool": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
              },
              "probe": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]"
              }
            }
          }
        ],
        "probes": [
          {
            "name": "TCP-Probe",
            "properties": {
              "protocol": "Tcp",
              "port": 80,
              "intervalInSeconds": 5,
              "numberOfProbes": 2
            }
          }
        ],
        "inboundNatRules": [
          {
            "name": "SSH-2-Primary",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]",
              },
              "frontendPort": 22,
              "backendPort": 22,
              "protocol": "Tcp"
            }
          }
        ],
        "outboundNatRules": [],
        "inboundNatPools": []
      },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]"
      ]
    },
    {
      "apiVersion": "2015-06-15",
      "name": "frontNsg",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "22",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-Health-Monitoring",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "AzureLoadBalancer",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 200,
              "direction": "Inbound"
            }
          },
          {
            "name": "Disallow-everything-else-Inbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-to-VNet",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "VirtualNetwork",
              "access": "Allow",
              "priority": 100,
              "direction": "Outbound"
            }
          },
          {
            "name": "Allow-to-8443",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "8443",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "Internet",
              "access": "Allow",
              "priority": 200,
              "direction": "Outbound"
            }
          },
          {
            "name": "Disallow-everything-else-Outbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('Front NIC')]",
      "tags": {
        "displayName": "Front NICs"
      },
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                }
              ],
              "loadBalancerInboundNatRules": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "name": "[variables('Front VM')]",
      "tags": {
        "displayName": "Front VMs"
      },
      "apiVersion": "2016-04-30-preview",
      "location": "[resourceGroup().location]",
      "properties": {
        "availabilitySet": {
          "id": "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
        },
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "OpenLogic",
            "offer": "CentOS",
            "sku": "7.3",
            "version": "latest"
          },
          "osDisk": {
            "name": "[variables('Front VM')]",
            "createOption": "FromImage",
            "caching": "ReadWrite"
          },
          "dataDisks": []
        },
        "osProfile": {
          "computerName": "[variables('Front VM')]",
          "adminUsername": "[parameters('VM Admin User Name')]",
          "adminPassword": "[parameters('VM Admin Password')]"
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]",
        "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
      ]
    },
    {
      "name": "[variables('Front Availability Set Name')]",
      "type": "Microsoft.Compute/availabilitySets",
      "location": "[resourceGroup().location]",
      "apiVersion": "2016-04-30-preview",
      "tags": {
        "displayName": "FrontAvailabilitySet"
      },
      "properties": {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "managed": true
      },
      "dependsOn": []
    }
  ]
}
```

We used the resource group named <i>md-demo-snapshot</i>.

This deploys a single Linux VM into a managed availability set using a premium managed disk

The deployment <b>takes a few minutes</b>
<h3>Customize VM</h3>
<ol>
 	<li>Login to the VM</li>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
 	<li>In the bash shell type <br />
touch myfile</li>
 	<li>This simply creates a file in the home directory of the admin user</li>
</ol>
&nbsp;
<h3>Login into ISE</h3>
<ol>
 	<li>Open up PowerShell ISE</li>
 	<li>Type Add-AzureRmAccount</li>
 	<li>Enter your credentials ; those credentials should be the same you are using to log into the Azure Portal</li>
 	<li>If you have more than one subscriptions</li>
</ol>
<ol>
 	<li>Type Get-AzureRmSubscription</li>
 	<li>This should list all subscriptions you have access (even partial) to</li>
 	<li>Select the <i>SubscriptionId</i> (a GUID) of the subscription you want to use</li>
 	<li>Type Select-AzureRmSubscription -SubscriptionId &lt;SubscriptionId&gt;
<i>&lt;SubscriptionId&gt;</i> is the value you just selected</li>
 	<li>This will select the specified subscription as the “current one”, i.e. future queries will be done against that subscription</li>
</ol>
<h3>Create Snapshot</h3>
<ol>
 	<li>In PowerShell ISE, type
$rgName = 'md-demo-snapshot' # or the Resource Group name you used
$disk = Get-AzureRmDisk -ResourceGroupName $rgName
$config = New-AzureRmSnapshotConfig -SourceUri $disk.Id -CreateOption Copy -Location $disk.Location
$snapshot = New-AzureRmSnapshot -Snapshot $config -SnapshotName ($disk.Name+'-snapshot') -ResourceGroupName $rgName</li>
 	<li>This creates a snapshot of the managed disk</li>
 	<li>Snapshots are stored in standard storage and are full copies of the disk (incremental isn’t supported yet)</li>
</ol>
<h3>Look at snapshot</h3>
<ol>
 	<li>In the portal, go to the resource group</li>
 	<li>Select the snapshot resource
<a href="/assets/posts/2017/1/taking-a-snapshot-of-a-managed-disk/clip_image0021.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image002" src="/assets/posts/2017/1/taking-a-snapshot-of-a-managed-disk/clip_image002_thumb1.jpg" alt="clip_image002" border="0" /></a></li>
 	<li>Notice the storage type is standard LRS</li>
</ol>
<h3>Change the existing VM</h3>
<ol>
 	<li>Back in the SSH session, type
touch myotherfile</li>
 	<li>We do this simply to differentiate from the snapshot</li>
</ol>
<h3>Deploy VM from snapshot</h3>

```JavaScript

{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "VM Admin User Name": {
      "defaultValue": "myadmin",
      "type": "string"
    },
    "VM Admin Password": {
      "defaultValue": null,
      "type": "securestring"
    },
    "VM Size": {
      "defaultValue": "Standard_DS4",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3",
        "Standard_DS4",
        "Standard_DS5"
      ],
      "metadata": {
        "description": "SKU of the VM."
      }
    },
    "Public Domain Label": {
      "type": "string"
    }
  },
  "variables": {
    "Vhds Container Name": "vhds",
    "frontIpRange": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Front Address Pool Name": "frontPool",
    "Front NIC": "frontNic",
    "Front NIC Clone": "frontNic-Clone",
    "Front VM": "Demo-VM",
    "Front VM Clone": "Demo-VM-Clone",
    "Front Availability Set Name": "frontAvailSet",
    "VNET Name": "Demo-VNet"
  },
  "resources": [
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "name": "[variables('Public IP Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public IP"
      },
      "properties": {
        "publicIPAllocationMethod": "Dynamic",
        "idleTimeoutInMinutes": 4,
        "dnsSettings": {
          "domainNameLabel": "[parameters('Public Domain Label')]"
        }
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "name": "[variables('VNet Name')]",
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "10.0.0.0/16"
          ]
        },
        "subnets": [
          {
            "name": "front",
            "properties": {
              "addressPrefix": "[variables('frontIpRange')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
      ]
    },
    {
      "type": "Microsoft.Network/loadBalancers",
      "name": "[variables('Public LB Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public Load Balancer"
      },
      "properties": {
        "frontendIPConfigurations": [
          {
            "name": "LoadBalancerFrontEnd",
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Front Address Pool Name')]"
          }
        ],
        "loadBalancingRules": [
          {
            "name": "Http",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 80,
              "backendPort": 80,
              "enableFloatingIP": false,
              "idleTimeoutInMinutes": 4,
              "protocol": "Tcp",
              "loadDistribution": "Default",
              "backendAddressPool": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
              },
              "probe": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]"
              }
            }
          }
        ],
        "probes": [
          {
            "name": "TCP-Probe",
            "properties": {
              "protocol": "Tcp",
              "port": 80,
              "intervalInSeconds": 5,
              "numberOfProbes": 2
            }
          }
        ],
        "inboundNatRules": [
          {
            "name": "SSH-2-Primary",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 22,
              "backendPort": 22,
              "protocol": "Tcp"
            }
          },
          {
            "name": "SSH-2-Secondary",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 5000,
              "backendPort": 22,
              "protocol": "Tcp"
            }
          }
        ],
        "outboundNatRules": [],
        "inboundNatPools": []
      },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]"
      ]
    },
    {
      "apiVersion": "2015-06-15",
      "name": "frontNsg",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "22",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-Health-Monitoring",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "AzureLoadBalancer",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 200,
              "direction": "Inbound"
            }
          },
          {
            "name": "Disallow-everything-else-Inbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-to-VNet",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "VirtualNetwork",
              "access": "Allow",
              "priority": 100,
              "direction": "Outbound"
            }
          },
          {
            "name": "Allow-to-8443",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "8443",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "Internet",
              "access": "Allow",
              "priority": 200,
              "direction": "Outbound"
            }
          },
          {
            "name": "Disallow-everything-else-Outbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('Front NIC')]",
      "tags": {
        "displayName": "Front NIC"
      },
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                }
              ],
              "loadBalancerInboundNatRules": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Primary')]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "name": "[variables('Front VM')]",
      "tags": {
        "displayName": "Front VM"
      },
      "apiVersion": "2016-04-30-preview",
      "location": "[resourceGroup().location]",
      "properties": {
        "availabilitySet": {
          "id": "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
        },
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "OpenLogic",
            "offer": "CentOS",
            "sku": "7.3",
            "version": "latest"
          },
          "osDisk": {
            "name": "[variables('Front VM')]",
            "createOption": "FromImage",
            "caching": "ReadWrite"
          },
          "dataDisks": []
        },
        "osProfile": {
          "computerName": "[variables('Front VM')]",
          "adminUsername": "[parameters('VM Admin User Name')]",
          "adminPassword": "[parameters('VM Admin Password')]"
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC'))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[variables('Front NIC')]",
        "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
      ]
    },
    {
      "name": "[variables('Front Availability Set Name')]",
      "type": "Microsoft.Compute/availabilitySets",
      "location": "[resourceGroup().location]",
      "apiVersion": "2016-04-30-preview",
      "tags": {
        "displayName": "FrontAvailabilitySet"
      },
      "properties": {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "managed": true
      },
      "dependsOn": []
    },
    {
      "name": "[variables('Front VM Clone')]",
      "type": "Microsoft.Compute/disks",
      "location": "[resourceGroup().location]",
      "apiVersion": "2016-04-30-preview",
      "tags": {
        "displayName": "Clone Disk"
      },
      "properties": {
        "creationData": {
          "createOption": "copy",
          "sourceUri": "[resourceId('Microsoft.Compute/snapshots', concat(variables('Front VM'), '-snapshot'))]"
        },
        "accountType": "Premium_LRS",
        "diskSizeGB": 127,
        "osType": ""
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "name": "[variables('Front NIC Clone')]",
      "tags": {
        "displayName": "Front NIC Clone"
      },
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                }
              ],
              "loadBalancerInboundNatRules": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/inboundNatRules/SSH-2-Secondary')]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "name": "[variables('Front VM Clone')]",
      "tags": {
        "displayName": "Front VM Clone"
      },
      "apiVersion": "2016-04-30-preview",
      "location": "[resourceGroup().location]",
      "properties": {
        "availabilitySet": {
          "id": "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
        },
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "osDisk": {
            "name": "[variables('Front VM Clone')]",
            "createOption": "attach",
            "managedDisk": {
              "id": "[resourceId('Microsoft.Compute/disks', variables('Front VM Clone'))]"
            },
            "osType": "Linux",
            "caching": "ReadWrite"
          },
          "dataDisks": []
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC Clone'))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]",
        "[resourceId('Microsoft.Network/networkInterfaces', variables('Front NIC Clone'))]",
        "[resourceId('Microsoft.Compute/disks', variables('Front VM Clone'))]"
      ]
    }
  ]
}
```


Deploy it in the same resource group, with the same arguments
<h3>Validate VM</h3>
<ol>
 	<li>Login to the Clone VM</li>
 	<li>We suggest using Putty tool with SSH (SSH port is opened on NSG)</li>
 	<li>Look at <i>MyPublicIP </i>to find the DNS of the public IP in order to SSH to it</li>
 	<li>Use the port 5000 as that is the port NAT to the SSH port of the clone VM</li>
 	<li>In the bash shell type <br />
ls</li>
 	<li>You should see “myfile”, hence the snapshot of the first customization</li>
</ol>
&nbsp;
<h3>Exercise</h3>
Try do the same with data disks.
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-snapshot -Force