import React, { useMemo, useState, useEffect } from 'react'
import Typography from '@material-ui/core/Typography'
import styled from 'styled-components/macro'
import { CellWrapper, SortableTable } from 'src/components/Table'
import { DateTime } from 'luxon'
import { Div, Icon } from 'src/components/ui'
import { findNetworkBySlug } from 'src/utils'
import { getTokenImage } from 'src/utils/tokens'
import { CopyEthAddress } from 'src/components/ui/CopyEthAddress'
import Box from '@material-ui/core/Box'

const Container: any = styled(Div)<any>`
  overflow: auto;
`

export const populateLowBonderBalances = (item: any) => {
  const chain = findNetworkBySlug(item.chain)
  const bridge = getTokenImage(item.bridge)

  return {
    bridge: bridge,
    nativeToken: chain?.imageUrl,
    bonder: item.bonder,
    amount: item.amountFormatted?.toFixed(4)
  }
}

export const populateUnbondedTransfers = (item: any) => {
  const sourceChain = findNetworkBySlug(item.sourceChain)
  const destinationChain = findNetworkBySlug(item.destinationChain)
  const token = getTokenImage(item.token)

  return {
    sourceChain: sourceChain?.imageUrl,
    destinationChain: destinationChain?.imageUrl,
    token: token,
    timestamp: DateTime.fromSeconds(item.timestamp).toRelative(),
    transferId: item.transferId,
    transactionHash: item.transactionHash,
    amount: item.amountFormatted?.toFixed(4)
  }
}

export const populateUnbondedTransferRoots = (item: any) => {
  const sourceChain = findNetworkBySlug(item.sourceChain)
  const destinationChain = findNetworkBySlug(item.destinationChain)
  const token = getTokenImage(item.token)

  return {
    sourceChain: sourceChain?.imageUrl,
    destinationChain: destinationChain?.imageUrl,
    transferRootHash: item.transferRootHash,
    token: token,
    timestamp: DateTime.fromSeconds(item.timestamp).toRelative(),
    totalAmount: item.totalAmountFormatted?.toFixed(4)
  }
}

export const populateIncompleteSettlements = (item: any) => {
  const sourceChain = findNetworkBySlug(item.sourceChain)
  const destinationChain = findNetworkBySlug(item.destinationChain)
  const token = getTokenImage(item.token)

  return {
    timestamp: DateTime.fromSeconds(item.timestamp).toRelative(),
    transferRootHash: item.transferRootHash,
    sourceChain: sourceChain?.imageUrl,
    destinationChain: destinationChain?.imageUrl,
    token: token,
    totalAmount: item.totalAmountFormatted?.toFixed(4),
    diffAmount: item.diffAmountFormatted?.toFixed(4),
    settlementEvents: item.settlementEvents,
    withdrewEvents: item.withdrewEvents,
    isConfirmed: `${item.isConfirmed}`,
  }
}

export const populateChallengedRoots = (item: any) => {
  const token = getTokenImage(item.token)

  return {
    token: token,
    transactionHash: item.transactionHash,
    transferRootHash: item.transferRootHash,
    transferRootId: item.transferRootId,
    originalAmount: item.originalAmountFormatted?.toFixed(4)
  }
}

function useData() {
  const [lowBonderBalances, setLowBonderBalances] = useState<any>([])
  const [unbondedTransfers, setUnbondedTransfers] = useState<any>([])
  const [unbondedTransferRoots, setUnbondedTransferRoots] = useState<any>([])
  const [incompleteSettlements, setIncompleteSettlements] = useState<any>([])
  const [challengedTransferRoots, setChallengedTransferRoots] = useState<any>([])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [fetching, setFetching] = useState<boolean>(false)

  useEffect(() => {
    setFetching(true)
    const update = async () => {
      try {
        const url = 'https://assets.hop.exchange/mainnet/v1-health-check.json'
        const res = await fetch(url)
        const result = await res.json()
        console.log('result:', result)
        if (result?.timestamp) {
          setLastUpdated(DateTime.fromMillis(result.timestamp).toRelative() as string)
        }
        if (result?.data?.lowBonderBalances) {
          setLowBonderBalances(result.data.lowBonderBalances)
        }
        if (result?.data?.unbondedTransfers) {
          setUnbondedTransfers(result.data.unbondedTransfers)
        }
        if (result?.data?.unbondedTransferRoots) {
          setUnbondedTransferRoots(result.data.unbondedTransferRoots)
        }
        if (result?.data?.incompleteSettlements) {
          setIncompleteSettlements(result.data.incompleteSettlements)
        }
        if (result?.data?.challengedTransferRoots) {
          setChallengedTransferRoots(result.data.challengedTransferRoots)
        }
      } catch (err) {
        console.error(err)
      }
      setFetching(false)
    }
    update().catch(console.error)
  }, [])

  return {
    lowBonderBalances,
    unbondedTransfers,
    unbondedTransferRoots,
    incompleteSettlements,
    challengedTransferRoots,
    lastUpdated,
    fetching
  }
}

const Health = () => {
  const { lowBonderBalances, unbondedTransfers, unbondedTransferRoots, incompleteSettlements, challengedTransferRoots, lastUpdated, fetching } = useData()
  const cell = ({ cell }) => (
                <CellWrapper cell={cell}>
                  {cell.value}
                </CellWrapper>
              )
  const cellIcon = ({ cell }) => (
                <CellWrapper cell={cell}>
                  <Icon src={cell.value} />
                </CellWrapper>
              )
  const cellNumber = ({ cell }) => (
                <CellWrapper cell={cell} end>
                  {cell.value}
                </CellWrapper>
              )
  const cellAddress = ({ cell }) => (
                <CellWrapper cell={cell} end>
                  <CopyEthAddress value={cell.value} />
                </CellWrapper>
              )
  const lowBonderBalancesColumns = [{
    Header: 'Low Bonder Balances',
    columns: [
      {
        Header: 'Bridge',
        accessor: 'bridge',
        Cell: cellIcon,
      },
      {
        Header: 'Bonder',
        accessor: 'bonder',
        Cell: cellAddress,
      },
      {
        Header: 'Native Token',
        accessor: 'nativeToken',
        Cell: cellIcon
      },
      {
        Header: 'Amount',
        accessor: 'amount',
        Cell: cellNumber,
      },
    ]
  }]
  const unbondedTransfersColumns = [{
    Header: 'Unbonded Transfers',
    columns: [
      {
        Header: 'Date',
        accessor: 'timestamp',
        Cell: cell,
      },
      {
        Header: 'Source',
        accessor: 'sourceChain',
        Cell: cellIcon,
      },
      {
        Header: 'Destination',
        accessor: 'destinationChain',
        Cell: cellIcon
      },
      {
        Header: 'Transfer ID',
        accessor: 'transferId',
        Cell: cellAddress
      },
      {
        Header: 'Transaction Hash',
        accessor: 'transactionHash',
        Cell: cellAddress,
      },
      {
        Header: 'Token',
        accessor: 'token',
        Cell: cellIcon,
      },
      {
        Header: 'Amount',
        accessor: 'amount',
        Cell: cellNumber,
      },
    ]
  }]
  const unbondedTransferRootsColumns = [{
    Header: 'Unbonded Transfer Roots',
    columns: [
      {
        Header: 'Date',
        accessor: 'timestamp',
        Cell: cell,
      },
      {
        Header: 'Source',
        accessor: 'sourceChain',
        Cell: cellIcon,
      },
      {
        Header: 'Destination',
        accessor: 'destinationChain',
        Cell: cellIcon
      },
      {
        Header: 'Transfer Root Hash',
        accessor: 'transferRootHash',
        Cell: cellAddress
      },
      {
        Header: 'Token',
        accessor: 'token',
        Cell: cellIcon,
      },
      {
        Header: 'Total Amount',
        accessor: 'totalAmount',
        Cell: cellNumber,
      },
    ]
  }]
  const incompleteSettlementsColumns = [{
    Header: 'Incomplete Settlements',
    columns: [
      {
        Header: 'Date',
        accessor: 'timestamp',
        Cell: cell,
      },
      {
        Header: 'Source',
        accessor: 'sourceChain',
        Cell: cellIcon,
      },
      {
        Header: 'Destination',
        accessor: 'destinationChain',
        Cell: cellIcon
      },
      {
        Header: 'Transfer Root Hash',
        accessor: 'transferRootHash',
        Cell: cellAddress,
      },
      {
        Header: 'Token',
        accessor: 'token',
        Cell: cellIcon,
      },
      {
        Header: 'Total Amount',
        accessor: 'totalAmount',
        Cell: cellNumber,
      },
      {
        Header: 'Diff Amount',
        accessor: 'diffAmount',
        Cell: cellNumber,
      },
      {
        Header: 'Settlement Events',
        accessor: 'settlementEvents',
        Cell: cell,
      },
      {
        Header: 'Withdrew Events',
        accessor: 'withdrewEvents',
        Cell: cell,
      },
      {
        Header: 'Confirmed',
        accessor: 'isConfirmed',
        Cell: cell,
      },
    ]
  }]
  const challengedTransferRootsColumns = [{
    Header: 'Challenged Transfer Roots',
    columns: [
      {
        Header: 'Token',
        accessor: 'token',
        Cell: cellIcon,
      },
      {
        Header: 'Transaction Hash',
        accessor: 'transactionHash',
        Cell: cellAddress,
      },
      {
        Header: 'Transfer Root Hash',
        accessor: 'transferRootHash',
        Cell: cellAddress
      },
      {
        Header: 'Transfer Root ID',
        accessor: 'transferRootId',
        Cell: cellAddress,
      },
      {
        Header: 'Original Amount',
        accessor: 'originalAmount',
        Cell: cellNumber,
      },
    ]
  }]

  return (
    <Container fontSize={[0, 1, 2]}>
      <Box m={2} display="flex" justifyContent="center">
        <Typography variant="body1">
          Last updated {lastUpdated || '-'}
        </Typography>
      </Box>
      <Box m={2} display="flex" justifyContent="center">
        <SortableTable
          stats={ lowBonderBalances }
          columns={ lowBonderBalancesColumns }
          populateDataFn={ populateLowBonderBalances }
          loading={ fetching }
        />
      </Box>
      <Box m={2} display="flex" justifyContent="center">
        <SortableTable
          stats={ unbondedTransfers }
          columns={ unbondedTransfersColumns }
          populateDataFn={ populateUnbondedTransfers }
          loading={ fetching }
        />
      </Box>
      <Box m={2} display="flex" justifyContent="center">
        <SortableTable
          stats={ unbondedTransferRoots }
          columns={ unbondedTransferRootsColumns }
          populateDataFn={ populateUnbondedTransferRoots }
          loading={ fetching }
        />
      </Box>
      <Box m={2} display="flex" justifyContent="center">
        <SortableTable
          stats={ incompleteSettlements }
          columns={ incompleteSettlementsColumns }
          populateDataFn={ populateIncompleteSettlements }
          loading={ fetching }
        />
      </Box>
      <Box m={2} display="flex" justifyContent="center">
        <SortableTable
          stats={ challengedTransferRoots }
          columns={ challengedTransferRootsColumns }
          populateDataFn={ populateChallengedRoots }
          loading={ fetching }
        />
      </Box>
    </Container>
  )
}

export default Health