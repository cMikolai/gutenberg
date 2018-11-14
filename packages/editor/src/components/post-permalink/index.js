/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { ClipboardButton, Button, ExternalLink } from '@wordpress/components';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import PostPermalinkEditor from './editor.js';
import PostPreviewButton from '../post-preview-button';
import { getWPAdminURL, cleanForSlug } from '../../utils/url';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );

		this.addVisibilityCheck = this.addVisibilityCheck.bind( this );
		this.onVisibilityChange = this.onVisibilityChange.bind( this );

		this.state = {
			isCopied: false,
			isEditingPermalink: false,
		};
	}

	addVisibilityCheck() {
		window.addEventListener( 'visibilitychange', this.onVisibilityChange );
	}

	onVisibilityChange() {
		const { isEditable, refreshPost } = this.props;
		// If the user just returned after having clicked the "Change Permalinks" button,
		// fetch a new copy of the post from the server, just in case they enabled permalinks.
		if ( ! isEditable && 'visible' === document.visibilityState ) {
			refreshPost();
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		// If we've just stopped editing the permalink, focus on the new permalink.
		if ( prevState.isEditingPermalink && ! this.state.isEditingPermalink ) {
			this.linkElement.focus();
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'visibilitychange', this.addVisibilityCheck );
	}

	render() {
		const { isNew, postLink, permalinkParts, postSlug, postTitle, isEditable, isPublished, title } = this.props;

		if ( isNew || ! postLink ) {
			return null;
		}

		const { isCopied, isEditingPermalink } = this.state;
		const ariaLabel = isCopied ? __( 'Permalink copied' ) : __( 'Copy the permalink' );

		const { prefix, postName, suffix } = permalinkParts;
		// Determine an alternate slug to use in case one has not been saved yet.
		const alternateSlug = ( 'auto-draft' !== postName && postTitle === title ) ? postName : cleanForSlug( title );
		const slug = postSlug || alternateSlug;
		const samplePermalink = ( isEditable ) ? prefix + slug + suffix : prefix;

		return (
			<div className="editor-post-permalink">
				<ClipboardButton
					className={ classnames( 'editor-post-permalink__copy', { 'is-copied': isCopied } ) }
					text={ samplePermalink }
					label={ ariaLabel }
					onCopy={ () => this.setState( { isCopied: true } ) }
					aria-disabled={ isCopied }
					icon="admin-links"
				/>

				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>

				{ ! isEditingPermalink && isPublished &&
					<ExternalLink
						className="editor-post-permalink__link"
						href={ ! isPublished ? postLink : samplePermalink }
						target="_blank"
						ref={ ( linkElement ) => this.linkElement = linkElement }
					>
						{ ( title || postSlug ) ? safeDecodeURI( samplePermalink ) : postLink }
						&lrm;
					</ExternalLink>
				}

				{ ! isEditingPermalink && ! isPublished &&
					<PostPreviewButton
						isPermalink={ true }
						className="editor-post-permalink__link"
						samplePermalink={ title || postSlug ? samplePermalink : postLink }
						linkElement={ ( linkElement ) => this.linkElement = linkElement }
					/>
				}

				{ isEditingPermalink &&
					<PostPermalinkEditor
						postSlug={ slug }
						onSave={ () => this.setState( { isEditingPermalink: false } ) }
					/>
				}

				{ isEditable && ! isEditingPermalink && ( title || postSlug ) &&
					<Button
						className="editor-post-permalink__edit"
						isLarge
						onClick={ () => this.setState( { isEditingPermalink: true } ) }
					>
						{ __( 'Edit' ) }
					</Button>
				}

				{ ! isEditable &&
					<Button
						className="editor-post-permalink__change"
						isLarge
						href={ getWPAdminURL( 'options-permalink.php' ) }
						onClick={ this.addVisibilityCheck }
						target="_blank"
					>
						{ __( 'Change Permalinks' ) }
					</Button>
				}
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isCleanNewPost,
			isPermalinkEditable,
			getCurrentPost,
			getPermalinkParts,
			getEditedPostAttribute,
			isCurrentPostPublished,
		} = select( 'core/editor' );

		const { link, title } = getCurrentPost();

		return {
			isNew: isCleanNewPost(),
			postLink: link,
			postTitle: title,
			permalinkParts: getPermalinkParts(),
			postSlug: getEditedPostAttribute( 'slug' ),
			isEditable: isPermalinkEditable(),
			isPublished: isCurrentPostPublished(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { refreshPost } = dispatch( 'core/editor' );
		return { refreshPost };
	} ),
] )( PostPermalink );
