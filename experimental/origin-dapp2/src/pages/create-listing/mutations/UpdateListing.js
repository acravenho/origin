import React, { Component } from 'react'
import { Mutation } from 'react-apollo'

import UpdateListingMutation from 'mutations/UpdateListing'

import TransactionError from 'components/TransactionError'
import WaitForTransaction from 'components/WaitForTransaction'
import Redirect from 'components/Redirect'
import withCanTransact from 'hoc/withCanTransact'
import withWallet from 'hoc/withWallet'

import applyListingData from './_listingData'

class UpdateListing extends Component {
  state = {}
  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect} push />
    }
    return (
      <Mutation
        mutation={UpdateListingMutation}
        onCompleted={({ updateListing }) => {
          this.setState({ waitFor: updateListing.id })
        }}
        onError={errorData =>
          this.setState({ waitFor: false, error: 'mutation', errorData })
        }
      >
        {updateListing => (
          <>
            <button
              className={this.props.className}
              onClick={() => this.onClick(updateListing)}
              children={this.props.children}
            />
            {this.renderWaitModal()}
            {this.state.error && (
              <TransactionError
                reason={this.state.error}
                data={this.state.errorData}
                onClose={() => this.setState({ error: false })}
              />
            )}
          </>
        )}
      </Mutation>
    )
  }

  onClick(updateListing) {
    if (this.props.cannotTransact) {
      this.setState({
        error: this.props.cannotTransact,
        errorData: this.props.cannotTransactData
      })
      return
    }

    this.setState({ waitFor: 'pending' })

    const { listing, tokenBalance, wallet } = this.props

    updateListing({
      variables: applyListingData(this.props, {
        listingID: this.props.listingId,
        additionalDeposit:
          tokenBalance >= Number(listing.boost) ? listing.boost : '0',
        from: wallet,
      })
    })
  }

  renderWaitModal() {
    if (!this.state.waitFor) return null

    return (
      <WaitForTransaction hash={this.state.waitFor} event="ListingUpdated">
        {({ event, client }) => (
          <div className="make-offer-modal">
            <div className="success-icon" />
            <div>Success!</div>

            <button
              href="#"
              className="btn btn-outline-light"
              onClick={async () => {
                await client.resetStore()
                // TODO: Fix listing ID
                this.setState({
                  redirect: `/listings/999-1-${event.returnValues.listingID}`
                })
              }}
              children="View Listing"
            />
          </div>
        )}
      </WaitForTransaction>
    )
  }
}

export default withWallet(withCanTransact(UpdateListing))
